import type { WorkerInfo } from '@code-quest/shared';
import { BattleOverlay } from '../Battle/BattleOverlay.tsx';
import { StreamOutput } from './StreamOutput.tsx';
import { WorkerPaneHeader } from './WorkerPaneHeader.tsx';

interface WorkerPaneProps {
  index: number;
  worker: WorkerInfo;
  isPaused?: boolean;
  onRetryWorker?: (workerId: string) => void;
  onSkipWorker?: (workerId: string) => void;
}

export function WorkerPane({
  index,
  worker,
  isPaused,
  onRetryWorker,
  onSkipWorker,
}: WorkerPaneProps) {
  return (
    <div className="worker-pane" data-testid={`worker-pane-${worker.id}`}>
      <WorkerPaneHeader
        index={index}
        worker={worker}
        isPaused={isPaused}
        onRetry={onRetryWorker ? () => onRetryWorker(worker.id) : undefined}
        onSkip={onSkipWorker ? () => onSkipWorker(worker.id) : undefined}
      />
      <div style={{ position: 'relative', flex: 1 }}>
        <StreamOutput text={worker.result} error={worker.error} />
        <BattleOverlay sessionId={worker.id} />
      </div>
    </div>
  );
}
