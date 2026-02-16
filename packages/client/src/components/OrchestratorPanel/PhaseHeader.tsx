import type { OrchestratorStatus, WorkerInfo } from '@code-quest/shared';

interface PhaseHeaderProps {
  status: OrchestratorStatus;
  workers: WorkerInfo[];
  onAbort?: () => void;
}

const statusConfig: Record<OrchestratorStatus, { icon: string; label: string }> = {
  idle: { icon: '\u25CF', label: 'Planning' },
  dispatching: { icon: '\u27F3', label: 'Dispatching...' },
  'workers-running': { icon: '\u27F3', label: 'Workers Running' },
  merging: { icon: '\u27F3', label: 'Merging Branches...' },
  'workers-paused': { icon: '\u23F8', label: 'Paused — Workers Failed' },
  'workers-complete': { icon: '\u2713', label: 'All Workers Complete' },
  synthesizing: { icon: '\u2726', label: 'Synthesizing Results...' },
  complete: { icon: '\u2726', label: 'Complete' },
  error: { icon: '\u2717', label: 'Error' },
};

const showAbort = new Set<OrchestratorStatus>([
  'dispatching',
  'workers-running',
  'merging',
  'synthesizing',
]);

export function PhaseHeader({ status, workers, onAbort }: PhaseHeaderProps) {
  const config = statusConfig[status];
  const doneCount = workers.filter((w) => w.status === 'complete' || w.status === 'skipped').length;
  const errorCount = workers.filter((w) => w.status === 'error').length;
  const totalCount = workers.length;
  const showProgress =
    status === 'workers-running' || status === 'workers-complete' || status === 'workers-paused';
  const progressPercent = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  return (
    <div className={`phase-header`} data-testid="phase-header">
      <div className={`phase-header__status phase-header__status--${status}`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
        {showProgress && (
          <span className="phase-header__progress">
            <span>
              {`${doneCount}/${totalCount}`}
              {errorCount > 0 && ` (${errorCount} failed)`}
            </span>
            <div
              className="phase-header__progress-bar"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="phase-header__progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </span>
        )}
      </div>

      <div className="phase-header__actions">
        {showAbort.has(status) && onAbort && (
          <button type="button" className="btn btn--danger" onClick={onAbort} aria-label="Abort">
            Abort
          </button>
        )}
      </div>
    </div>
  );
}
