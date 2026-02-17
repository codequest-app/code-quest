import type {
  ChatProvider,
  ChatStreamEvent,
  OrchestratorStatus,
  SubTask,
  WorkerInfo,
} from '@code-quest/shared';
import {
  orchestratorAbortSchema,
  orchestratorCreateSchema,
  orchestratorDispatchSchema,
  orchestratorKillSchema,
  orchestratorRetryWorkerSchema,
  orchestratorSkipWorkerSchema,
  orchestratorSynthesizeSchema,
} from '@code-quest/shared';
import { useCallback, useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useOrchestratorStore } from '../stores/orchestratorStore';
import { useSystemStore } from '../stores/systemStore';
import { useTerminalStore } from '../stores/terminalStore';
import { safeValidate } from '../utils/validateAndEmit.ts';
import { useSocket } from './useSocket';

interface UseOrchestratorSocketReturn {
  createOrchestrator: (provider: ChatProvider) => void;
  dispatch: (orchId: string, tasks: SubTask[]) => void;
  synthesize: (orchId: string) => void;
  abortOrchestrator: (orchId: string) => void;
  killOrchestrator: (orchId: string) => void;
  retryWorker: (orchId: string, workerId: string) => void;
  skipWorker: (orchId: string, workerId: string) => void;
}

export function useOrchestratorSocket(serverUrl: string): UseOrchestratorSocketReturn {
  const { socket, emit } = useSocket(serverUrl);
  const {
    initOrchestrator,
    setWorkers,
    updateWorkerStatus,
    setStatus,
    setAllComplete,
    removeOrchestrator,
  } = useOrchestratorStore();

  useEffect(() => {
    if (!socket) return;

    const handleCreated = (orchId: string, coordinatorId: string, provider: string) => {
      initOrchestrator(orchId, coordinatorId, provider as ChatProvider);
      // Also init the coordinator as a chat session so ChatPanel can display it
      useChatStore.getState().initChatSession(coordinatorId, provider as ChatProvider);
      // Add orchestrator tab
      useTerminalStore.getState().addSession(orchId, 0, 'orchestrator');
    };

    const handleDispatched = (orchId: string, workers: WorkerInfo[]) => {
      setWorkers(orchId, workers);
      const chat = useChatStore.getState();
      for (const worker of workers) {
        chat.initChatSession(worker.id, worker.task.provider);
        chat.addUserMessage(worker.id, worker.task.description);
      }
    };

    const handleWorkerEvent = (orchId: string, workerId: string, event: ChatStreamEvent) => {
      const chat = useChatStore.getState();
      // Lazily init chat session for workers started in later waves
      if (!chat.getChatSession(workerId)) {
        const orch = useOrchestratorStore.getState().getOrchestrator(orchId);
        const worker = orch?.workers.find((w) => w.id === workerId);
        const provider = worker?.task.provider ?? 'claude';
        chat.initChatSession(workerId, provider);
        if (worker) {
          chat.addUserMessage(workerId, worker.task.description);
        }
      }
      if (event.type === 'text') {
        const orch = useOrchestratorStore.getState().getOrchestrator(orchId);
        const worker = orch?.workers.find((w) => w.id === workerId);
        const currentResult = worker?.result ?? '';
        updateWorkerStatus(orchId, workerId, {
          status: 'running',
          result: currentResult + event.data.content,
        });
      }
      useChatStore.getState().handleChatEvent(workerId, event);
    };

    const handleWorkerComplete = (orchId: string, workerId: string, result: WorkerInfo) => {
      updateWorkerStatus(orchId, workerId, {
        status: result.status,
        result: result.result,
        stats: result.stats,
        error: result.error,
      });
    };

    const handleAllComplete = (orchId: string, results: WorkerInfo[]) => {
      setAllComplete(orchId, results);
    };

    const handleStatus = (orchId: string, status: OrchestratorStatus) => {
      setStatus(orchId, status);
    };

    const handleError = (orchId: string, _message: string) => {
      setStatus(orchId, 'error');
    };

    const handleMergeError = (orchId: string, workerId: string, error: string) => {
      updateWorkerStatus(orchId, workerId, {
        status: 'error',
        error: `Merge conflict: ${error}`,
      });
    };

    const handleWorkersUpdated = (orchId: string, workers: WorkerInfo[]) => {
      setWorkers(orchId, workers);
    };

    const handleCapabilities = (caps: { worktree: boolean }) => {
      useSystemStore.getState().setCapabilities(caps);
      if (!caps.worktree && !useSystemStore.getState().worktreeToastShown) {
        console.warn(
          '[system] Git worktree not available — workers will share the same working directory.',
        );
        useSystemStore.getState().markWorktreeToastShown();
      }
    };

    socket.on('orchestrator:created', handleCreated);
    socket.on('orchestrator:dispatched', handleDispatched);
    socket.on('orchestrator:worker-event', handleWorkerEvent);
    socket.on('orchestrator:worker-complete', handleWorkerComplete);
    socket.on('orchestrator:all-complete', handleAllComplete);
    socket.on('orchestrator:status', handleStatus);
    socket.on('orchestrator:error', handleError);
    socket.on('orchestrator:merge-error', handleMergeError);
    socket.on('orchestrator:workers-updated', handleWorkersUpdated);
    socket.on('system:capabilities', handleCapabilities);

    return () => {
      socket.off('orchestrator:created', handleCreated);
      socket.off('orchestrator:dispatched', handleDispatched);
      socket.off('orchestrator:worker-event', handleWorkerEvent);
      socket.off('orchestrator:worker-complete', handleWorkerComplete);
      socket.off('orchestrator:all-complete', handleAllComplete);
      socket.off('orchestrator:status', handleStatus);
      socket.off('orchestrator:error', handleError);
      socket.off('orchestrator:merge-error', handleMergeError);
      socket.off('orchestrator:workers-updated', handleWorkersUpdated);
      socket.off('system:capabilities', handleCapabilities);
    };
  }, [socket, initOrchestrator, setWorkers, updateWorkerStatus, setStatus, setAllComplete]);

  const createOrchestrator = useCallback(
    (provider: ChatProvider) => {
      const result = safeValidate(orchestratorCreateSchema, { provider });
      if (!result.success) {
        console.warn('[orchestrator:create] validation failed', result.error);
        return;
      }
      emit('orchestrator:create', { provider });
    },
    [emit],
  );

  const dispatch = useCallback(
    (orchId: string, tasks: SubTask[]) => {
      const result = safeValidate(orchestratorDispatchSchema, { orchId, tasks });
      if (!result.success) {
        console.warn('[orchestrator:dispatch] validation failed', result.error);
        return;
      }
      emit('orchestrator:dispatch', orchId, tasks);
    },
    [emit],
  );

  const synthesize = useCallback(
    (orchId: string) => {
      const result = safeValidate(orchestratorSynthesizeSchema, { orchId });
      if (!result.success) {
        console.warn('[orchestrator:synthesize] validation failed', result.error);
        return;
      }
      emit('orchestrator:synthesize', orchId);
    },
    [emit],
  );

  const abortOrchestrator = useCallback(
    (orchId: string) => {
      const result = safeValidate(orchestratorAbortSchema, { orchId });
      if (!result.success) {
        console.warn('[orchestrator:abort] validation failed', result.error);
        return;
      }
      emit('orchestrator:abort', orchId);
    },
    [emit],
  );

  const killOrchestrator = useCallback(
    (orchId: string) => {
      const result = safeValidate(orchestratorKillSchema, { orchId });
      if (!result.success) {
        console.warn('[orchestrator:kill] validation failed', result.error);
        return;
      }
      emit('orchestrator:kill', orchId);
      const orch = useOrchestratorStore.getState().getOrchestrator(orchId);
      if (orch) {
        const chat = useChatStore.getState();
        for (const worker of orch.workers) {
          chat.removeChatSession(worker.id);
        }
      }
      removeOrchestrator(orchId);
    },
    [emit, removeOrchestrator],
  );

  const retryWorker = useCallback(
    (orchId: string, workerId: string) => {
      const result = safeValidate(orchestratorRetryWorkerSchema, { orchId, workerId });
      if (!result.success) {
        console.warn('[orchestrator:retry-worker] validation failed', result.error);
        return;
      }
      emit('orchestrator:retry-worker', orchId, workerId);
    },
    [emit],
  );

  const skipWorker = useCallback(
    (orchId: string, workerId: string) => {
      const result = safeValidate(orchestratorSkipWorkerSchema, { orchId, workerId });
      if (!result.success) {
        console.warn('[orchestrator:skip-worker] validation failed', result.error);
        return;
      }
      emit('orchestrator:skip-worker', orchId, workerId);
    },
    [emit],
  );

  return {
    createOrchestrator,
    dispatch,
    synthesize,
    abortOrchestrator,
    killOrchestrator,
    retryWorker,
    skipWorker,
  };
}
