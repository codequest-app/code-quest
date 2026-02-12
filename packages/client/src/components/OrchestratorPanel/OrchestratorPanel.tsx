import { useOrchestratorStore } from '../../stores/orchestratorStore';
import { ChatPanel } from '../ChatPanel';
import { DispatchForm } from './DispatchForm';
import { WorkerPanel } from './WorkerPanel';
import { StatsBar } from '../ChatPanel/StatsBar';
import type { SubTask } from '../../types';

interface OrchestratorPanelProps {
  orchestratorId: string;
  onSendCoordinator: (sessionId: string, message: string) => void;
  onAbortCoordinator: (sessionId: string) => void;
  onDispatch: (orchId: string, tasks: SubTask[]) => void;
  onSynthesize: (orchId: string) => void;
  onAbort: (orchId: string) => void;
}

export function OrchestratorPanel({
  orchestratorId,
  onSendCoordinator,
  onAbortCoordinator,
  onDispatch,
  onSynthesize,
  onAbort,
}: OrchestratorPanelProps) {
  const orch = useOrchestratorStore((state) => state.getOrchestrator(orchestratorId));

  if (!orch) {
    return (
      <div className="orchestrator-panel" data-testid="orchestrator-panel">
        <div className="orch-empty">Orchestrator not found</div>
      </div>
    );
  }

  return (
    <div className="orchestrator-panel" data-testid="orchestrator-panel">
      {/* Coordinator Chat */}
      <div className="coordinator-section">
        <ChatPanel
          sessionId={orch.coordinatorId}
          onSend={onSendCoordinator}
          onAbort={onAbortCoordinator}
        />
      </div>

      {/* Dispatch Form */}
      <DispatchForm
        status={orch.status}
        onDispatch={(tasks) => onDispatch(orchestratorId, tasks)}
        onSynthesize={() => onSynthesize(orchestratorId)}
        onAbort={() => onAbort(orchestratorId)}
      />

      {/* Worker Cards */}
      <WorkerPanel workers={orch.workers} />

      {/* Aggregated Stats */}
      {orch.aggregatedStats && (
        <div className="orch-stats" data-testid="orchestrator-stats">
          <StatsBar stats={orch.aggregatedStats} />
        </div>
      )}

      <style>{`
        .orchestrator-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #1e1e1e;
          color: #d4d4d4;
        }
        .coordinator-section {
          flex: 1;
          overflow: hidden;
          min-height: 200px;
        }
        .orch-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6c6c6c;
          font-size: 14px;
        }
        .orch-stats {
          border-top: 1px solid #3e3e42;
        }
      `}</style>
    </div>
  );
}
