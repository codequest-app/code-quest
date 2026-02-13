import type { WorkerInfo } from '@code-quest/shared';

interface WorkerCardProps {
  worker: WorkerInfo;
}

const STATUS_ICONS: Record<WorkerInfo['status'], string> = {
  pending: '\u23F3',
  running: '\u27F3',
  complete: '\u2713',
  error: '\u2717',
};

const STATUS_COLORS: Record<WorkerInfo['status'], string> = {
  pending: '#6c6c6c',
  running: '#3794ff',
  complete: '#0dbc79',
  error: '#ff4444',
};

export function WorkerCard({ worker }: WorkerCardProps) {
  const icon = STATUS_ICONS[worker.status];
  const color = STATUS_COLORS[worker.status];
  const providerLabel = worker.task.provider === 'claude' ? 'Claude' : 'Gemini';

  const preview =
    worker.status === 'error'
      ? worker.error || 'Unknown error'
      : (worker.result || '').slice(0, 120);

  return (
    <div className="worker-card" data-testid="worker-card" data-status={worker.status}>
      <div className="worker-header">
        <span className="worker-status" style={{ color }} data-testid="worker-status-icon">
          {icon}
        </span>
        <span className="worker-provider">{providerLabel}</span>
      </div>
      <div className="worker-description">{worker.task.description}</div>
      {preview && (
        <div className="worker-preview" data-testid="worker-preview">
          {preview}
        </div>
      )}
      {worker.stats && (
        <div className="worker-stats">
          {worker.stats.costUsd != null && `$${worker.stats.costUsd.toFixed(4)}`}
          {worker.stats.durationMs != null &&
            ` \u00B7 ${(worker.stats.durationMs / 1000).toFixed(1)}s`}
        </div>
      )}

      <style>{`
        .worker-card {
          background: #2d2d30;
          border: 1px solid #3e3e42;
          border-radius: 6px;
          padding: 12px;
          min-width: 200px;
          flex: 1;
        }
        .worker-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .worker-status {
          font-size: 16px;
        }
        .worker-provider {
          font-size: 12px;
          color: #999;
        }
        .worker-description {
          font-size: 13px;
          color: #d4d4d4;
          margin-bottom: 6px;
        }
        .worker-preview {
          font-size: 11px;
          color: #888;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 4px;
        }
        .worker-stats {
          font-size: 11px;
          color: #666;
        }
      `}</style>
    </div>
  );
}
