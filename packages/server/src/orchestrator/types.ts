import type {
  ChatProvider,
  ChatStats,
  ChatStreamEvent,
  OrchestratorStatus,
  SubTask,
  WorkerInfo,
} from '@code-quest/shared';

export type OrchestratorSessionFactory = (options: {
  provider: ChatProvider;
}) => OrchestratorSession;

export interface OrchestratorSession {
  readonly id: string;
  readonly coordinatorId: string;
  readonly status: OrchestratorStatus;
  readonly workers: WorkerInfo[];

  dispatch(tasks: SubTask[]): void;
  synthesize(): void;
  abort(): void;
  kill(): void;
  getWorkerResults(): WorkerInfo[];
  getAggregatedStats(): ChatStats;

  onStatusChange(handler: (status: OrchestratorStatus) => void): void;
  onWorkerEvent(handler: (workerId: string, event: ChatStreamEvent) => void): void;
  onWorkerComplete(handler: (workerId: string, result: WorkerInfo) => void): void;
  onComplete(handler: (stats: ChatStats) => void): void;
  onError(handler: (message: string) => void): void;
  onMergeError(handler: (workerId: string, error: string) => void): void;
}
