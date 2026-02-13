import { beforeEach, describe, expect, it } from 'vitest';
import { useOrchestratorStore } from '../orchestratorStore';

describe('orchestratorStore', () => {
  beforeEach(() => {
    useOrchestratorStore.setState({ orchestrators: new Map() });
  });

  it('should init orchestrator session', () => {
    const store = useOrchestratorStore.getState();
    store.initOrchestrator('orch-1', 'coord-1', 'claude');

    const orch = store.getOrchestrator('orch-1');
    expect(orch).toBeDefined();
    expect(orch?.orchestratorId).toBe('orch-1');
    expect(orch?.coordinatorId).toBe('coord-1');
    expect(orch?.provider).toBe('claude');
    expect(orch?.status).toBe('idle');
    expect(orch?.workers).toEqual([]);
  });

  it('should track workers after dispatch', () => {
    const store = useOrchestratorStore.getState();
    store.initOrchestrator('orch-1', 'coord-1', 'claude');

    const workers = [
      {
        id: 'w1',
        task: { description: 'task1', provider: 'claude' as const },
        status: 'pending' as const,
      },
      {
        id: 'w2',
        task: { description: 'task2', provider: 'gemini' as const },
        status: 'pending' as const,
      },
    ];
    useOrchestratorStore.getState().setWorkers('orch-1', workers);

    const orch = useOrchestratorStore.getState().getOrchestrator('orch-1');
    expect(orch?.workers).toHaveLength(2);
    expect(orch?.workers[0].task.description).toBe('task1');
    expect(orch?.workers[1].task.provider).toBe('gemini');
  });

  it('should update worker status on worker-event', () => {
    const store = useOrchestratorStore.getState();
    store.initOrchestrator('orch-1', 'coord-1', 'claude');
    store.setWorkers('orch-1', [
      { id: 'w1', task: { description: 'task1', provider: 'claude' }, status: 'pending' },
    ]);

    useOrchestratorStore.getState().updateWorkerStatus('orch-1', 'w1', {
      status: 'running',
    });

    const orch = useOrchestratorStore.getState().getOrchestrator('orch-1');
    expect(orch?.workers[0].status).toBe('running');
  });

  it('should mark worker complete with result', () => {
    const store = useOrchestratorStore.getState();
    store.initOrchestrator('orch-1', 'coord-1', 'claude');
    store.setWorkers('orch-1', [
      { id: 'w1', task: { description: 'task1', provider: 'claude' }, status: 'running' },
    ]);

    useOrchestratorStore.getState().updateWorkerStatus('orch-1', 'w1', {
      status: 'complete',
      result: 'Worker output text',
      stats: { costUsd: 0.001, durationMs: 500 },
    });

    const orch = useOrchestratorStore.getState().getOrchestrator('orch-1');
    expect(orch?.workers[0].status).toBe('complete');
    expect(orch?.workers[0].result).toBe('Worker output text');
    expect(orch?.workers[0].stats?.costUsd).toBe(0.001);
  });

  it('should mark all-complete when all workers done', () => {
    const store = useOrchestratorStore.getState();
    store.initOrchestrator('orch-1', 'coord-1', 'claude');

    const results = [
      {
        id: 'w1',
        task: { description: 'task1', provider: 'claude' as const },
        status: 'complete' as const,
        result: 'output1',
      },
      {
        id: 'w2',
        task: { description: 'task2', provider: 'gemini' as const },
        status: 'complete' as const,
        result: 'output2',
      },
    ];

    useOrchestratorStore.getState().setAllComplete('orch-1', results);

    const orch = useOrchestratorStore.getState().getOrchestrator('orch-1');
    expect(orch?.status).toBe('workers-complete');
    expect(orch?.workers).toHaveLength(2);
    expect(orch?.workers.every((w) => w.status === 'complete')).toBe(true);
  });

  it('should aggregate stats across workers + coordinator', () => {
    const store = useOrchestratorStore.getState();
    store.initOrchestrator('orch-1', 'coord-1', 'claude');

    useOrchestratorStore.getState().setAggregatedStats('orch-1', {
      costUsd: 0.005,
      durationMs: 1200,
      inputTokens: 100,
      outputTokens: 50,
    });

    const orch = useOrchestratorStore.getState().getOrchestrator('orch-1');
    expect(orch?.aggregatedStats).toBeDefined();
    expect(orch?.aggregatedStats?.costUsd).toBe(0.005);
    expect(orch?.aggregatedStats?.inputTokens).toBe(100);
  });

  it('should track orchestrator status lifecycle', () => {
    const store = useOrchestratorStore.getState();
    store.initOrchestrator('orch-1', 'coord-1', 'claude');

    expect(useOrchestratorStore.getState().getOrchestrator('orch-1')?.status).toBe('idle');

    useOrchestratorStore.getState().setStatus('orch-1', 'dispatching');
    expect(useOrchestratorStore.getState().getOrchestrator('orch-1')?.status).toBe('dispatching');

    useOrchestratorStore.getState().setStatus('orch-1', 'workers-running');
    expect(useOrchestratorStore.getState().getOrchestrator('orch-1')?.status).toBe(
      'workers-running',
    );

    useOrchestratorStore.getState().setStatus('orch-1', 'workers-complete');
    expect(useOrchestratorStore.getState().getOrchestrator('orch-1')?.status).toBe(
      'workers-complete',
    );

    useOrchestratorStore.getState().setStatus('orch-1', 'synthesizing');
    expect(useOrchestratorStore.getState().getOrchestrator('orch-1')?.status).toBe('synthesizing');

    useOrchestratorStore.getState().setStatus('orch-1', 'complete');
    expect(useOrchestratorStore.getState().getOrchestrator('orch-1')?.status).toBe('complete');
  });

  it('should remove orchestrator session', () => {
    const store = useOrchestratorStore.getState();
    store.initOrchestrator('orch-1', 'coord-1', 'claude');

    useOrchestratorStore.getState().removeOrchestrator('orch-1');
    expect(useOrchestratorStore.getState().getOrchestrator('orch-1')).toBeUndefined();
  });

  it('should handle update on non-existent orchestrator gracefully', () => {
    const store = useOrchestratorStore.getState();
    // Should not throw
    store.setStatus('non-existent', 'error');
    store.setWorkers('non-existent', []);
    store.updateWorkerStatus('non-existent', 'w1', { status: 'complete' });

    expect(store.getOrchestrator('non-existent')).toBeUndefined();
  });
});
