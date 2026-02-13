import type { WorkerInfo } from '@code-quest/shared';
import { WorkerCard } from './WorkerCard';

interface WorkerPanelProps {
  workers: WorkerInfo[];
}

export function WorkerPanel({ workers }: WorkerPanelProps) {
  if (workers.length === 0) {
    return null;
  }

  return (
    <div className="worker-panel" data-testid="worker-panel">
      <div className="worker-panel-header">Workers ({workers.length})</div>
      <div className="worker-grid">
        {workers.map((worker) => (
          <WorkerCard key={worker.id} worker={worker} />
        ))}
      </div>

      <style>{`
        .worker-panel {
          padding: 12px;
          border-top: 1px solid #3e3e42;
        }
        .worker-panel-header {
          font-size: 13px;
          color: #999;
          margin-bottom: 8px;
        }
        .worker-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
