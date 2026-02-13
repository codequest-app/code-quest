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
  orchestratorSynthesizeSchema,
} from '@code-quest/shared';
import { useCallback, useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useOrchestratorStore } from '../stores/orchestratorStore';
import { useTerminalStore } from '../stores/terminalStore';
import { safeValidate } from '../utils/validateAndEmit.ts';
import { useSocket } from './useSocket';

interface UseOrchestratorSocketReturn {
  createOrchestrator: (provider: ChatProvider) => void;
  dispatch: (orchId: string, tasks: SubTask[]) => void;
  synthesize: (orchId: string) => void;
  abortOrchestrator: (orchId: string) => void;
  killOrchestrator: (orchId: string) => void;
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
    };

    const handleWorkerEvent = (orchId: string, workerId: string, event: ChatStreamEvent) => {
      if (event.type === 'text') {
        const orch = useOrchestratorStore.getState().getOrchestrator(orchId);
        const worker = orch?.workers.find((w) => w.id === workerId);
        const currentResult = worker?.result ?? '';
        updateWorkerStatus(orchId, workerId, {
          status: 'running',
          result: currentResult + event.data.content,
        });
      }
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

    socket.on('orchestrator:created', handleCreated);
    socket.on('orchestrator:dispatched', handleDispatched);
    socket.on('orchestrator:worker-event', handleWorkerEvent);
    socket.on('orchestrator:worker-complete', handleWorkerComplete);
    socket.on('orchestrator:all-complete', handleAllComplete);
    socket.on('orchestrator:status', handleStatus);
    socket.on('orchestrator:error', handleError);

    return () => {
      socket.off('orchestrator:created', handleCreated);
      socket.off('orchestrator:dispatched', handleDispatched);
      socket.off('orchestrator:worker-event', handleWorkerEvent);
      socket.off('orchestrator:worker-complete', handleWorkerComplete);
      socket.off('orchestrator:all-complete', handleAllComplete);
      socket.off('orchestrator:status', handleStatus);
      socket.off('orchestrator:error', handleError);
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
      removeOrchestrator(orchId);
    },
    [emit, removeOrchestrator],
  );

  return { createOrchestrator, dispatch, synthesize, abortOrchestrator, killOrchestrator };
}
