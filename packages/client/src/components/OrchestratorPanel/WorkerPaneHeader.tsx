import type { WorkerInfo } from '@code-quest/shared';

interface WorkerPaneHeaderProps {
  index: number;
  worker: WorkerInfo;
}

const statusIcons: Record<WorkerInfo['status'], string> = {
  pending: '\u23F3',
  running: '\u27F3',
  complete: '\u2713',
  error: '\u2717',
  skipped: '\u23ED',
};

function formatStats(worker: WorkerInfo): string | null {
  if (!worker.stats) return null;
  const parts: string[] = [];
  if (worker.stats.costUsd != null) {
    parts.push(`$${worker.stats.costUsd.toFixed(2)}`);
  }
  if (worker.stats.durationMs != null) {
    parts.push(`${(worker.stats.durationMs / 1000).toFixed(1)}s`);
  }
  return parts.length > 0 ? parts.join(' ') : null;
}

export function WorkerPaneHeader({ index, worker }: WorkerPaneHeaderProps) {
  const icon = statusIcons[worker.status];
  const stats = formatStats(worker);
  const providerLabel = worker.task.provider === 'claude' ? 'Claude' : 'Gemini';

  return (
    <div className="worker-pane__header">
      <div className="worker-pane__header-left">
        <span className={`worker-pane__status-icon worker-pane__status-icon--${worker.status}`}>
          {icon}
        </span>
        <span className="worker-pane__label">Worker {index + 1}</span>
        <span className="worker-pane__provider">{providerLabel}</span>
        <span className="worker-pane__task">{worker.task.description}</span>
      </div>
      <div className="worker-pane__header-right">{stats && <span>{stats}</span>}</div>
    </div>
  );
}
