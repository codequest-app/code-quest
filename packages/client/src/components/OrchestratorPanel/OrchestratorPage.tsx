import type { SubTask } from '@code-quest/shared';
import { socketManager } from '../../services/socket.ts';
import { useChatStore } from '../../stores/chatStore.ts';
import { useOrchestratorStore } from '../../stores/orchestratorStore.ts';
import { ControlRequestPrompt } from '../ChatPanel/ControlRequestPrompt.tsx';
import { ErrorView } from './ErrorView.tsx';
import { PhaseHeader } from './PhaseHeader.tsx';
import { PlanningView } from './PlanningView.tsx';
import { SynthesisView } from './SynthesisView.tsx';
import { WorkerGrid } from './WorkerGrid.tsx';
import './orchestrator.css';

interface OrchestratorPageProps {
  orchestratorId: string;
  onSendCoordinator: (sessionId: string, message: string) => void;
  onAbortCoordinator: (sessionId: string) => void;
  onDispatch: (orchId: string, tasks: SubTask[]) => void;
  onSynthesize: (orchId: string) => void;
  onAbort: (orchId: string) => void;
  onRetryWorker: (orchId: string, workerId: string) => void;
  onSkipWorker: (orchId: string, workerId: string) => void;
}

export function OrchestratorPage({
  orchestratorId,
  onSendCoordinator,
  onAbortCoordinator,
  onDispatch,
  onSynthesize,
  onAbort,
  onRetryWorker,
  onSkipWorker,
}: OrchestratorPageProps) {
  const orch = useOrchestratorStore((state) => state.getOrchestrator(orchestratorId));

  const workers = orch?.workers ?? [];
  const workerIds = workers.map((w) => w.id).filter(Boolean);

  // Collect pending control requests from all worker sessions
  const allWorkerControlRequests = useChatStore((state) => {
    const requests: Array<{
      workerId: string;
      requestId: string;
      subtype: string;
      toolName?: string;
      input?: unknown;
      callbackId?: string;
      toolUseId?: string;
    }> = [];
    for (const wid of workerIds) {
      const session = state.chatSessions.get(wid);
      if (session) {
        for (const req of session.pendingControlRequests) {
          requests.push({ ...req, workerId: wid });
        }
      }
    }
    return requests;
  });

  if (!orch) {
    return (
      <div className="orchestrator-page" data-testid="orchestrator-page">
        <div className="dispatching-overlay">Orchestrator not found</div>
      </div>
    );
  }

  const { status } = orch;

  // Group by toolName for batch approval
  const controlGroups = new Map<string, typeof allWorkerControlRequests>();
  for (const req of allWorkerControlRequests) {
    const key = req.toolName ?? req.subtype;
    const group = controlGroups.get(key) ?? [];
    group.push(req);
    controlGroups.set(key, group);
  }

  return (
    <div className="orchestrator-page" data-testid="orchestrator-page">
      <PhaseHeader status={status} workers={workers} onAbort={() => onAbort(orchestratorId)} />

      {controlGroups.size > 0 && (
        <div className="control-requests-container">
          {Array.from(controlGroups.entries()).map(([key, reqs]) => (
            <ControlRequestPrompt
              key={key}
              requests={reqs}
              onRespondAll={(response) => {
                const socket = socketManager.getCurrentSocket();
                for (const req of reqs) {
                  socket?.emit('chat:control-respond', req.workerId, req.requestId, response);
                  useChatStore.getState().clearPendingControlRequest(req.workerId, req.requestId);
                }
              }}
              onDismiss={() => {
                for (const req of reqs) {
                  useChatStore.getState().clearPendingControlRequest(req.workerId, req.requestId);
                }
              }}
            />
          ))}
        </div>
      )}

      <div className="phase-content">
        {status === 'idle' && (
          <PlanningView
            coordinatorId={orch.coordinatorId}
            onSend={onSendCoordinator}
            onAbort={onAbortCoordinator}
            onDispatch={(tasks) => onDispatch(orchestratorId, tasks)}
          />
        )}
        {status === 'dispatching' && (
          <div data-testid="dispatching-overlay" className="dispatching-overlay">
            Dispatching...
          </div>
        )}
        {(status === 'workers-running' ||
          status === 'merging' ||
          status === 'workers-paused' ||
          status === 'workers-complete') && (
          <WorkerGrid
            orchestratorId={orchestratorId}
            workers={workers}
            status={status}
            onSynthesize={() => onSynthesize(orchestratorId)}
            onRetryWorker={(workerId) => onRetryWorker(orchestratorId, workerId)}
            onSkipWorker={(workerId) => onSkipWorker(orchestratorId, workerId)}
          />
        )}
        {(status === 'synthesizing' || status === 'complete') && (
          <SynthesisView
            coordinatorId={orch.coordinatorId}
            workers={workers}
            status={status}
            onSendCoordinator={onSendCoordinator}
            onAbortCoordinator={onAbortCoordinator}
          />
        )}
        {status === 'error' && (
          <ErrorView workers={workers} onRetry={() => onAbort(orchestratorId)} />
        )}
      </div>
    </div>
  );
}
