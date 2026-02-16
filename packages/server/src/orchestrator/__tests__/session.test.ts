import path from 'node:path';
import type { ChatStreamEvent, OrchestratorStatus, WorkerInfo } from '@code-quest/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ChatCommandsConfig, ChatManager } from '../../chat/types.ts';
import { TYPES } from '../../container.ts';
import { createTestContainer } from '../../test/create-test-container.ts';
import type { OrchestratorSessionImpl } from '../session.ts';
import type { OrchestratorSessionFactory } from '../types.ts';

const FAKE_CLAUDE_SCRIPT = path.resolve(__dirname, '../../../../..', 'e2e/fixtures/fake-claude.sh');

const mockChatCommandsConfig: ChatCommandsConfig = {
  claude: { command: 'bash', baseArgs: [FAKE_CLAUDE_SCRIPT] },
  gemini: { command: 'bash', baseArgs: [FAKE_CLAUDE_SCRIPT] },
};

function waitForStatus(
  orch: OrchestratorSessionImpl,
  target: OrchestratorStatus,
  timeoutMs = 10000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (orch.status === target) {
      resolve();
      return;
    }
    const timeout = setTimeout(
      () => reject(new Error(`Timeout waiting for status "${target}", current: "${orch.status}"`)),
      timeoutMs,
    );
    orch.onStatusChange((status) => {
      if (status === target) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}

describe('OrchestratorSession', () => {
  let chatManager: ChatManager;
  let createOrchestrator: OrchestratorSessionFactory;
  let orch: OrchestratorSessionImpl;
  let savedFixture: string | undefined;

  beforeEach(() => {
    savedFixture = process.env.FIXTURE;
    process.env.FIXTURE = 'echo';

    const container = createTestContainer({
      chatCommandsConfig: mockChatCommandsConfig,
    });
    chatManager = container.get<ChatManager>(TYPES.ChatManager);
    createOrchestrator = container.get<OrchestratorSessionFactory>(
      TYPES.OrchestratorSessionFactory,
    );
  });

  afterEach(() => {
    orch?.kill();
    chatManager.cleanup();
    if (savedFixture === undefined) {
      delete process.env.FIXTURE;
    } else {
      process.env.FIXTURE = savedFixture;
    }
  });

  it('should create with a coordinator chat session', () => {
    orch = createOrchestrator({ provider: 'claude' }) as OrchestratorSessionImpl;

    expect(orch.id).toBeTruthy();
    expect(orch.coordinatorId).toBeTruthy();
    expect(orch.status).toBe('idle');
    expect(chatManager.getSession(orch.coordinatorId)).toBeDefined();
  });

  it('should dispatch sub-tasks and create worker sessions', () => {
    orch = createOrchestrator({ provider: 'claude' }) as OrchestratorSessionImpl;

    orch.dispatch([
      { description: 'Write tests', provider: 'claude' },
      { description: 'Write docs', provider: 'gemini' },
    ]);

    expect(orch.workers).toHaveLength(2);
    expect(orch.workers[0].task.description).toBe('Write tests');
    expect(orch.workers[0].task.provider).toBe('claude');
    expect(orch.workers[1].task.description).toBe('Write docs');
    expect(orch.workers[1].task.provider).toBe('gemini');
  });

  it('should track worker completion', async () => {
    orch = createOrchestrator({ provider: 'claude' }) as OrchestratorSessionImpl;

    orch.dispatch([{ description: 'task1', provider: 'claude' }]);

    await waitForStatus(orch, 'workers-complete');

    expect(orch.status).toBe('workers-complete');
    expect(orch.getWorkerResults()).toHaveLength(1);
    expect(orch.getWorkerResults()[0].status).toBe('complete');
  });

  it('should collect worker text output', async () => {
    orch = createOrchestrator({ provider: 'claude' }) as OrchestratorSessionImpl;

    orch.dispatch([{ description: 'Hello from worker', provider: 'claude' }]);

    await waitForStatus(orch, 'workers-complete');

    const results = orch.getWorkerResults();
    expect(results[0].result).toContain('Hello from worker');
  });

  it('should emit events for each lifecycle phase', async () => {
    orch = createOrchestrator({ provider: 'claude' }) as OrchestratorSessionImpl;

    const statuses: OrchestratorStatus[] = [];
    orch.onStatusChange((s) => statuses.push(s));

    orch.dispatch([{ description: 'task1', provider: 'claude' }]);

    await waitForStatus(orch, 'workers-complete');

    expect(statuses).toContain('dispatching');
    expect(statuses).toContain('workers-running');
    expect(statuses).toContain('workers-complete');
  });

  it('should emit worker events during execution', async () => {
    orch = createOrchestrator({ provider: 'claude' }) as OrchestratorSessionImpl;

    const workerEvents: Array<{ workerId: string; event: ChatStreamEvent }> = [];
    orch.onWorkerEvent((workerId, event) => {
      workerEvents.push({ workerId, event });
    });

    orch.dispatch([{ description: 'task1', provider: 'claude' }]);

    await waitForStatus(orch, 'workers-complete');

    expect(workerEvents.length).toBeGreaterThan(0);
    expect(workerEvents.some((e) => e.event.type === 'text')).toBe(true);
  });

  it('should emit onWorkerComplete when a worker finishes', async () => {
    orch = createOrchestrator({ provider: 'claude' }) as OrchestratorSessionImpl;

    const completed: WorkerInfo[] = [];
    orch.onWorkerComplete((_id, result) => completed.push(result));

    orch.dispatch([{ description: 'task1', provider: 'claude' }]);

    await waitForStatus(orch, 'workers-complete');

    expect(completed).toHaveLength(1);
    expect(completed[0].status).toBe('complete');
  });

  it('should handle multiple workers completing', async () => {
    orch = createOrchestrator({ provider: 'claude' }) as OrchestratorSessionImpl;

    orch.dispatch([
      { description: 'task1', provider: 'claude' },
      { description: 'task2', provider: 'claude' },
      { description: 'task3', provider: 'gemini' },
    ]);

    await waitForStatus(orch, 'workers-complete');

    expect(orch.getWorkerResults()).toHaveLength(3);
    expect(orch.workers.every((w) => w.status === 'complete')).toBe(true);
  });

  it('should support mixed providers (claude + gemini)', async () => {
    orch = createOrchestrator({ provider: 'claude' }) as OrchestratorSessionImpl;

    orch.dispatch([
      { description: 'Claude task', provider: 'claude' },
      { description: 'Gemini task', provider: 'gemini' },
    ]);

    await waitForStatus(orch, 'workers-complete');

    expect(orch.workers[0].task.provider).toBe('claude');
    expect(orch.workers[1].task.provider).toBe('gemini');
    expect(orch.getWorkerResults()).toHaveLength(2);
  });

  it('should aggregate cost/token stats across all sessions', async () => {
    orch = createOrchestrator({ provider: 'claude' }) as OrchestratorSessionImpl;

    orch.dispatch([
      { description: 'task1', provider: 'claude' },
      { description: 'task2', provider: 'claude' },
    ]);

    await waitForStatus(orch, 'workers-complete');

    const stats = orch.getAggregatedStats();
    expect(stats.costUsd).toBeGreaterThan(0);
    expect(stats.inputTokens).toBeGreaterThan(0);
    expect(stats.outputTokens).toBeGreaterThan(0);
  });

  it('should send aggregated results to coordinator for synthesis', async () => {
    orch = createOrchestrator({ provider: 'claude' }) as OrchestratorSessionImpl;

    orch.dispatch([{ description: 'task1', provider: 'claude' }]);

    await waitForStatus(orch, 'workers-complete');

    orch.synthesize();
    expect(orch.status).toBe('synthesizing');

    await waitForStatus(orch, 'complete');
    expect(orch.status).toBe('complete');
  });

  it('should not dispatch when not idle', () => {
    orch = createOrchestrator({ provider: 'claude' }) as OrchestratorSessionImpl;

    const errors: string[] = [];
    orch.onError((msg) => errors.push(msg));

    orch.dispatch([{ description: 'task1', provider: 'claude' }]);
    orch.dispatch([{ description: 'task2', provider: 'claude' }]);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('not idle');
  });

  it('should not synthesize when workers are not complete', () => {
    orch = createOrchestrator({ provider: 'claude' }) as OrchestratorSessionImpl;

    const errors: string[] = [];
    orch.onError((msg) => errors.push(msg));

    orch.synthesize();

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('not complete');
  });

  it('should abort all workers on abort()', () => {
    orch = createOrchestrator({ provider: 'claude' }) as OrchestratorSessionImpl;

    orch.dispatch([{ description: 'task1', provider: 'claude' }]);

    orch.abort();

    expect(orch.status).toBe('error');
  });

  it('should handle worker errors gracefully', async () => {
    // Use a separate container with failing commands
    const failContainer = createTestContainer({
      chatCommandsConfig: {
        claude: {
          command: 'bash',
          baseArgs: [
            '-c',
            'echo \'{"type":"system","subtype":"init","session_id":"fail-1"}\'; echo "error occurred" >&2; exit 1',
          ],
        },
        gemini: {
          command: 'bash',
          baseArgs: [
            '-c',
            'echo \'{"type":"system","subtype":"init","session_id":"fail-1"}\'; echo "error occurred" >&2; exit 1',
          ],
        },
      },
    });

    const failChatManager = failContainer.get<ChatManager>(TYPES.ChatManager);
    const failCreateOrchestrator = failContainer.get<OrchestratorSessionFactory>(
      TYPES.OrchestratorSessionFactory,
    );

    orch = failCreateOrchestrator({ provider: 'claude' }) as OrchestratorSessionImpl;

    orch.dispatch([{ description: 'failing task', provider: 'claude' }]);

    await waitForStatus(orch, 'workers-paused');

    expect(orch.status).toBe('workers-paused');
    const workers = orch.workers;
    expect(workers[0].status).toBe('error');
    expect(workers[0].error).toBeTruthy();

    failChatManager.cleanup();
  });

  describe('workers-paused + skipWorker', () => {
    const failCommandsConfig: ChatCommandsConfig = {
      claude: {
        command: 'bash',
        baseArgs: [
          '-c',
          'echo \'{"type":"system","subtype":"init","session_id":"fail-1"}\'; echo "error occurred" >&2; exit 1',
        ],
      },
      gemini: {
        command: 'bash',
        baseArgs: [
          '-c',
          'echo \'{"type":"system","subtype":"init","session_id":"fail-1"}\'; echo "error occurred" >&2; exit 1',
        ],
      },
    };

    it('should pause when wave has mixed success and failure', async () => {
      // Use success for claude, failure for gemini
      const mixedContainer = createTestContainer({
        chatCommandsConfig: {
          claude: mockChatCommandsConfig.claude,
          gemini: failCommandsConfig.gemini,
        },
      });
      const mixedChatManager = mixedContainer.get<ChatManager>(TYPES.ChatManager);
      const mixedCreate = mixedContainer.get<OrchestratorSessionFactory>(
        TYPES.OrchestratorSessionFactory,
      );

      orch = mixedCreate({ provider: 'claude' }) as OrchestratorSessionImpl;

      orch.dispatch([
        { description: 'success task', provider: 'claude' },
        { description: 'failing task', provider: 'gemini' },
      ]);

      await waitForStatus(orch, 'workers-paused');

      expect(orch.status).toBe('workers-paused');
      const workers = orch.workers;
      expect(workers.find((w) => w.task.description === 'success task')?.status).toBe('complete');
      expect(workers.find((w) => w.task.description === 'failing task')?.status).toBe('error');

      mixedChatManager.cleanup();
    });

    it('should skip an error worker and resolve pause', async () => {
      const failContainer = createTestContainer({
        chatCommandsConfig: failCommandsConfig,
      });
      const failChatManager = failContainer.get<ChatManager>(TYPES.ChatManager);
      const failCreate = failContainer.get<OrchestratorSessionFactory>(
        TYPES.OrchestratorSessionFactory,
      );

      orch = failCreate({ provider: 'claude' }) as OrchestratorSessionImpl;

      orch.dispatch([{ description: 'failing task', provider: 'claude' }]);

      await waitForStatus(orch, 'workers-paused');

      const workerId = orch.workers[0].id;
      orch.skipWorker(workerId);

      await waitForStatus(orch, 'workers-complete');
      expect(orch.workers[0].status).toBe('skipped');

      failChatManager.cleanup();
    });

    it('should emit error when skipping non-error worker', () => {
      orch = createOrchestrator({ provider: 'claude' }) as OrchestratorSessionImpl;

      const errors: string[] = [];
      orch.onError((msg) => errors.push(msg));

      orch.skipWorker('nonexistent');

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Cannot skip worker');
    });

    it('should allow synthesize from workers-paused state', async () => {
      // Coordinator uses claude (success), workers use gemini (fail)
      const mixedContainer = createTestContainer({
        chatCommandsConfig: {
          claude: mockChatCommandsConfig.claude,
          gemini: failCommandsConfig.gemini,
        },
      });
      const mixedChatManager = mixedContainer.get<ChatManager>(TYPES.ChatManager);
      const mixedCreate = mixedContainer.get<OrchestratorSessionFactory>(
        TYPES.OrchestratorSessionFactory,
      );

      orch = mixedCreate({ provider: 'claude' }) as OrchestratorSessionImpl;

      orch.dispatch([{ description: 'failing task', provider: 'gemini' }]);

      await waitForStatus(orch, 'workers-paused');

      orch.synthesize();
      expect(orch.status).toBe('synthesizing');

      await waitForStatus(orch, 'complete');

      mixedChatManager.cleanup();
    });
  });
});
