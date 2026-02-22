import type { OrchestratorStatus, WorkerInfo } from '@code-quest/shared';
import { useOrchestratorStore } from '../../stores/orchestratorStore.ts';
import { WorkerPane } from './WorkerPane.tsx';
import { WorkerSidebarItem } from './WorkerSidebarItem.tsx';

interface WorkerGridProps {
  orchestratorId: string;
  workers: WorkerInfo[];
  status: OrchestratorStatus;
  onSynthesize: () => void;
  onRetryWorker?: (workerId: string) => void;
  onSkipWorker?: (workerId: string) => void;
}

export function WorkerGrid({
  orchestratorId,
  workers,
  status,
  onSynthesize,
  onRetryWorker,
  onSkipWorker,
}: WorkerGridProps) {
  const selectedWorkerId = useOrchestratorStore(
    (state) => state.getOrchestrator(orchestratorId)?.selectedWorkerId,
  );
  const selectWorker = useOrchestratorStore((state) => state.selectWorker);

  const showSynthesize = status === 'workers-complete' || status === 'workers-paused';
  const isPaused = status === 'workers-paused';
  const errorCount = isPaused ? workers.filter((w) => w.status === 'error').length : 0;

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId) ?? workers[0];
  const selectedIndex = selectedWorker ? workers.indexOf(selectedWorker) : 0;

  return (
    <div className="worker-grid" data-testid="worker-grid">
      <div className="worker-grid__body">
        <div className="worker-grid__sidebar">
          {workers.map((w, i) => (
            <WorkerSidebarItem
              key={w.id}
              index={i}
              worker={w}
              isSelected={w.id === (selectedWorker?.id ?? '')}
              onClick={() => selectWorker(orchestratorId, w.id)}
            />
          ))}
        </div>
        <div className="worker-grid__main">
          {selectedWorker && (
            <WorkerPane
              index={selectedIndex}
              worker={selectedWorker}
              isPaused={isPaused}
              onRetryWorker={onRetryWorker}
              onSkipWorker={onSkipWorker}
            />
          )}
        </div>
      </div>
      <div className="worker-grid__footer">
        <div className="worker-grid__stats">
          {workers.length} worker{workers.length !== 1 ? 's' : ''}
          {isPaused && errorCount > 0 && (
            <span className="worker-grid__paused-hint">
              {' '}
              — {errorCount} failed, awaiting action
            </span>
          )}
        </div>
        {showSynthesize && (
          <button
            type="button"
            className="btn btn--synthesize"
            onClick={onSynthesize}
            aria-label="Synthesize results"
          >
            {isPaused ? 'Synthesize Anyway' : 'Synthesize Results'}
          </button>
        )}
      </div>
    </div>
  );
}
