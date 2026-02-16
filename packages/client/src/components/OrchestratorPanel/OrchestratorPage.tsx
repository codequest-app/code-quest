import type { SubTask } from '@code-quest/shared';
import { useOrchestratorStore } from '../../stores/orchestratorStore.ts';
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

  if (!orch) {
    return (
      <div className="orchestrator-page" data-testid="orchestrator-page">
        <div className="dispatching-overlay">Orchestrator not found</div>
      </div>
    );
  }

  const { status, workers } = orch;

  return (
    <div className="orchestrator-page" data-testid="orchestrator-page">
      <PhaseHeader status={status} workers={workers} onAbort={() => onAbort(orchestratorId)} />
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
