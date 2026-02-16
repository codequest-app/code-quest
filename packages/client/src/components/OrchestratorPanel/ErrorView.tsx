import type { WorkerInfo } from '@code-quest/shared';

interface ErrorViewProps {
  workers: WorkerInfo[];
  onRetry: () => void;
}

export function ErrorView({ workers, onRetry }: ErrorViewProps) {
  const erroredWorkers = workers.filter((w) => w.status === 'error');

  return (
    <div className="error-view" data-testid="error-view">
      <div className="error-view__icon">⚠</div>
      <div className="error-view__title">Something went wrong</div>

      {erroredWorkers.length > 0 && (
        <div className="error-view__list">
          {erroredWorkers.map((worker) => (
            <div key={worker.id} className="error-view__item" data-testid="error-worker-item">
              <span className="error-view__item-task">{worker.task.description}</span>
              <span className="error-view__item-error">{worker.error ?? 'Unknown error'}</span>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="error-view__retry" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
