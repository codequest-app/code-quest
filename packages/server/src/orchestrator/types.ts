import type { ChatProvider, ChatStats, ChatStreamEvent } from '../chat/types.ts';

export type OrchestratorSessionFactory = (options: {
  provider: ChatProvider;
}) => OrchestratorSession;

export type OrchestratorStatus =
  | 'idle'
  | 'dispatching'
  | 'workers-running'
  | 'workers-complete'
  | 'synthesizing'
  | 'complete'
  | 'error';

export interface SubTask {
  description: string;
  provider: ChatProvider;
}

export interface WorkerInfo {
  id: string;
  task: SubTask;
  status: 'pending' | 'running' | 'complete' | 'error';
  result?: string;
  stats?: ChatStats;
  error?: string;
}

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
}
