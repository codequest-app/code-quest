import type { WorkerInfo } from '@code-quest/shared';

interface WorkerSummaryCardProps {
  index: number;
  worker: WorkerInfo;
}

const statusLabels: Record<WorkerInfo['status'], string> = {
  pending: 'pending',
  running: 'running',
  complete: 'complete',
  error: 'error',
  skipped: 'skipped',
};

export function WorkerSummaryCard({ index, worker }: WorkerSummaryCardProps) {
  const providerLabel = worker.task.provider === 'claude' ? 'Claude' : 'Gemini';
  const stats = worker.stats;

  const statParts: string[] = [];
  if (stats?.costUsd != null) statParts.push(`$${stats.costUsd.toFixed(2)}`);
  if (stats?.durationMs != null) statParts.push(`${(stats.durationMs / 1000).toFixed(1)}s`);

  return (
    <div className={`worker-summary-card worker-summary-card--${worker.status}`}>
      <div className="worker-summary-card__header">
        <span className="worker-summary-card__label">
          W{index + 1}: {statusLabels[worker.status]}
        </span>
        <span className="worker-summary-card__provider">{providerLabel}</span>
      </div>
      <div className="worker-summary-card__task">{worker.task.description}</div>
      {statParts.length > 0 && (
        <div className="worker-summary-card__stats">{statParts.join(' \u00B7 ')}</div>
      )}
    </div>
  );
}
