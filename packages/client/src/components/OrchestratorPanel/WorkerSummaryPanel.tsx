import type { WorkerInfo } from '@code-quest/shared';
import { WorkerSummaryCard } from './WorkerSummaryCard.tsx';

interface WorkerSummaryPanelProps {
  workers: WorkerInfo[];
}

export function WorkerSummaryPanel({ workers }: WorkerSummaryPanelProps) {
  return (
    <div className="worker-summary-panel" data-testid="worker-summary-panel">
      <div className="worker-summary-panel__title">Workers</div>
      {workers.map((worker, index) => (
        <WorkerSummaryCard key={worker.id} index={index} worker={worker} />
      ))}
    </div>
  );
}
