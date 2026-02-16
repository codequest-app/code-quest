import type { OrchestratorStatus, WorkerInfo } from '@code-quest/shared';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { CoordinatorPanel } from './CoordinatorPanel.tsx';
import { WorkerSummaryPanel } from './WorkerSummaryPanel.tsx';

interface SynthesisViewProps {
  coordinatorId: string;
  workers: WorkerInfo[];
  status: OrchestratorStatus;
  onSendCoordinator: (sessionId: string, message: string) => void;
  onAbortCoordinator: (sessionId: string) => void;
}

export function SynthesisView({ coordinatorId, workers }: SynthesisViewProps) {
  return (
    <div className="synthesis-view" data-testid="synthesis-view">
      <div className="synthesis-view__panels" style={{ flex: 1, overflow: 'hidden' }}>
        <Group orientation="horizontal">
          <Panel defaultSize={70} minSize={40}>
            <CoordinatorPanel coordinatorId={coordinatorId} />
          </Panel>
          <Separator className="resize-handle" />
          <Panel defaultSize={30} minSize={20}>
            <WorkerSummaryPanel workers={workers} />
          </Panel>
        </Group>
      </div>
    </div>
  );
}
