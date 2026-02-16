import type { WorkerInfo } from '@code-quest/shared';
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
      <StreamOutput text={worker.result} error={worker.error} />
    </div>
  );
}
