import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ChatManagerImpl } from '../../chat/manager';
import { ChatSessionImpl } from '../../chat/session';
import type { ChatStreamEvent } from '../../chat/types';
import { OrchestratorSessionImpl } from '../session';
import type { OrchestratorStatus, WorkerInfo } from '../types';

const FAKE_CLAUDE_SCRIPT = path.resolve(__dirname, '../../../../..', 'e2e/fixtures/fake-claude.sh');

/**
 * Test ChatManager that uses mock scripts instead of real CLI
 */
class MockChatManager extends ChatManagerImpl {
  private mockScript: string;

  constructor(mockScript = FAKE_CLAUDE_SCRIPT) {
    super();
    this.mockScript = mockScript;
  }

  createSession(options: { provider: 'claude' | 'gemini'; cwd?: string }) {
    const session = new ChatSessionImpl({
      provider: options.provider,
      command: 'bash',
      baseArgs: [this.mockScript],
      cwd: options.cwd,
      env: { ...process.env, FIXTURE: 'echo' },
    });
    // Register in parent's session map
    (this as any).sessions.set(session.id, session);
    return session;
  }
}

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
  let chatManager: MockChatManager;
  let orch: OrchestratorSessionImpl;

  beforeEach(() => {
    chatManager = new MockChatManager();
  });

  afterEach(() => {
    orch?.kill();
    chatManager.cleanup();
  });

  it('should create with a coordinator chat session', () => {
    orch = new OrchestratorSessionImpl({ chatManager, provider: 'claude' });

    expect(orch.id).toBeTruthy();
    expect(orch.coordinatorId).toBeTruthy();
    expect(orch.status).toBe('idle');
    expect(chatManager.getSession(orch.coordinatorId)).toBeDefined();
  });

  it('should dispatch sub-tasks and create worker sessions', () => {
    orch = new OrchestratorSessionImpl({ chatManager, provider: 'claude' });

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
    orch = new OrchestratorSessionImpl({ chatManager, provider: 'claude' });

    orch.dispatch([{ description: 'task1', provider: 'claude' }]);

    await waitForStatus(orch, 'workers-complete');

    expect(orch.status).toBe('workers-complete');
    expect(orch.getWorkerResults()).toHaveLength(1);
    expect(orch.getWorkerResults()[0].status).toBe('complete');
  });

  it('should collect worker text output', async () => {
    orch = new OrchestratorSessionImpl({ chatManager, provider: 'claude' });

    orch.dispatch([{ description: 'Hello from worker', provider: 'claude' }]);

    await waitForStatus(orch, 'workers-complete');

    const results = orch.getWorkerResults();
    expect(results[0].result).toContain('Hello from worker');
  });

  it('should emit events for each lifecycle phase', async () => {
    orch = new OrchestratorSessionImpl({ chatManager, provider: 'claude' });

    const statuses: OrchestratorStatus[] = [];
    orch.onStatusChange((s) => statuses.push(s));

    orch.dispatch([{ description: 'task1', provider: 'claude' }]);

    await waitForStatus(orch, 'workers-complete');

    expect(statuses).toContain('dispatching');
    expect(statuses).toContain('workers-running');
    expect(statuses).toContain('workers-complete');
  });

  it('should emit worker events during execution', async () => {
    orch = new OrchestratorSessionImpl({ chatManager, provider: 'claude' });

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
    orch = new OrchestratorSessionImpl({ chatManager, provider: 'claude' });

    const completed: WorkerInfo[] = [];
    orch.onWorkerComplete((_id, result) => completed.push(result));

    orch.dispatch([{ description: 'task1', provider: 'claude' }]);

    await waitForStatus(orch, 'workers-complete');

    expect(completed).toHaveLength(1);
    expect(completed[0].status).toBe('complete');
  });

  it('should handle multiple workers completing', async () => {
    orch = new OrchestratorSessionImpl({ chatManager, provider: 'claude' });

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
    orch = new OrchestratorSessionImpl({ chatManager, provider: 'claude' });

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
    orch = new OrchestratorSessionImpl({ chatManager, provider: 'claude' });

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
    orch = new OrchestratorSessionImpl({ chatManager, provider: 'claude' });

    orch.dispatch([{ description: 'task1', provider: 'claude' }]);

    await waitForStatus(orch, 'workers-complete');

    orch.synthesize();
    expect(orch.status).toBe('synthesizing');

    await waitForStatus(orch, 'complete');
    expect(orch.status).toBe('complete');
  });

  it('should not dispatch when not idle', () => {
    orch = new OrchestratorSessionImpl({ chatManager, provider: 'claude' });

    const errors: string[] = [];
    orch.onError((msg) => errors.push(msg));

    orch.dispatch([{ description: 'task1', provider: 'claude' }]);
    orch.dispatch([{ description: 'task2', provider: 'claude' }]);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('not idle');
  });

  it('should not synthesize when workers are not complete', () => {
    orch = new OrchestratorSessionImpl({ chatManager, provider: 'claude' });

    const errors: string[] = [];
    orch.onError((msg) => errors.push(msg));

    orch.synthesize();

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('not complete');
  });

  it('should abort all workers on abort()', () => {
    orch = new OrchestratorSessionImpl({ chatManager, provider: 'claude' });

    orch.dispatch([{ description: 'task1', provider: 'claude' }]);

    orch.abort();

    expect(orch.status).toBe('error');
  });

  it('should handle worker errors gracefully', async () => {
    // Use a script that writes to stderr and exits with error
    const failManager = new MockChatManager();
    // Override to create failing sessions
    failManager.createSession = function (options: {
      provider: 'claude' | 'gemini';
      cwd?: string;
    }) {
      const session = new ChatSessionImpl({
        provider: options.provider,
        command: 'bash',
        baseArgs: [
          '-c',
          'echo \'{"type":"system","subtype":"init","session_id":"fail-1"}\'; echo "error occurred" >&2; exit 1',
        ],
        cwd: options.cwd,
      });
      (this as any).sessions.set(session.id, session);
      return session;
    };

    orch = new OrchestratorSessionImpl({ chatManager: failManager, provider: 'claude' });

    orch.dispatch([{ description: 'failing task', provider: 'claude' }]);

    await waitForStatus(orch, 'workers-complete');

    const workers = orch.workers;
    expect(workers[0].status).toBe('error');
    expect(workers[0].error).toBeTruthy();

    failManager.cleanup();
  });
});
