import type { OrchestratorStatus, WorkerInfo } from '@code-quest/shared';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { WorkerPane } from './WorkerPane.tsx';

interface WorkerGridProps {
  workers: WorkerInfo[];
  status: OrchestratorStatus;
  onSynthesize: () => void;
  onRetryWorker?: (workerId: string) => void;
  onSkipWorker?: (workerId: string) => void;
}

function ResizeHandle() {
  return <Separator className="resize-handle" />;
}

interface PanelCallbacks {
  isPaused: boolean;
  onRetryWorker?: (workerId: string) => void;
  onSkipWorker?: (workerId: string) => void;
}

function renderPanels(workers: WorkerInfo[], callbacks?: PanelCallbacks) {
  const count = workers.length;

  if (count === 1) {
    return (
      <Group orientation="vertical">
        <Panel>
          <WorkerPane {...callbacks} index={0} worker={workers[0]} />
        </Panel>
      </Group>
    );
  }

  if (count === 2) {
    return (
      <Group orientation="vertical">
        <Panel minSize={20}>
          <WorkerPane {...callbacks} index={0} worker={workers[0]} />
        </Panel>
        <ResizeHandle />
        <Panel minSize={20}>
          <WorkerPane {...callbacks} index={1} worker={workers[1]} />
        </Panel>
      </Group>
    );
  }

  if (count === 3) {
    return (
      <Group orientation="vertical">
        <Panel minSize={20}>
          <Group orientation="horizontal">
            <Panel minSize={20}>
              <WorkerPane {...callbacks} index={0} worker={workers[0]} />
            </Panel>
            <ResizeHandle />
            <Panel minSize={20}>
              <WorkerPane {...callbacks} index={1} worker={workers[1]} />
            </Panel>
          </Group>
        </Panel>
        <ResizeHandle />
        <Panel minSize={20}>
          <WorkerPane {...callbacks} index={2} worker={workers[2]} />
        </Panel>
      </Group>
    );
  }

  // 4+ workers: 2-column grid
  const rows: WorkerInfo[][] = [];
  for (let i = 0; i < count; i += 2) {
    rows.push(workers.slice(i, i + 2));
  }

  return (
    <Group orientation="vertical">
      {rows.flatMap((row, rowIdx) => {
        const elements: React.ReactNode[] = [];
        if (rowIdx > 0) {
          elements.push(<ResizeHandle key={`rh-${row[0].id}`} />);
        }
        elements.push(
          <Panel key={row[0].id} minSize={15}>
            {row.length === 1 ? (
              <WorkerPane {...callbacks} index={rowIdx * 2} worker={row[0]} />
            ) : (
              <Group orientation="horizontal">
                <Panel minSize={20}>
                  <WorkerPane {...callbacks} index={rowIdx * 2} worker={row[0]} />
                </Panel>
                <ResizeHandle />
                <Panel minSize={20}>
                  <WorkerPane {...callbacks} index={rowIdx * 2 + 1} worker={row[1]} />
                </Panel>
              </Group>
            )}
          </Panel>,
        );
        return elements;
      })}
    </Group>
  );
}

export function WorkerGrid({
  workers,
  status,
  onSynthesize,
  onRetryWorker,
  onSkipWorker,
}: WorkerGridProps) {
  const showSynthesize = status === 'workers-complete' || status === 'workers-paused';
  const isPaused = status === 'workers-paused';
  const errorCount = isPaused ? workers.filter((w) => w.status === 'error').length : 0;

  return (
    <div className="worker-grid" data-testid="worker-grid">
      <div className="worker-grid__panels">
        {renderPanels(workers, { isPaused, onRetryWorker, onSkipWorker })}
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
