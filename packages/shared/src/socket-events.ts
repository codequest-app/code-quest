import type { z } from 'zod';
import type {
  chatCreateSchema,
  orchestratorCreateSchema,
  terminalCreateSchema,
} from './schemas.ts';
import type {
  ChatStats,
  ChatStreamEvent,
  OrchestratorStatus,
  SubTask,
  SystemCapabilities,
  WorkerInfo,
} from './types.ts';

type TerminalCreateOptions = z.infer<typeof terminalCreateSchema>;
type ChatCreateOptions = z.infer<typeof chatCreateSchema>;
type OrchestratorCreateOptions = z.infer<typeof orchestratorCreateSchema>;

/**
 * Socket events for client -> server
 */
export interface ClientToServerEvents {
  'terminal:create': (options?: TerminalCreateOptions) => void;
  'terminal:write': (sessionId: string, data: string) => void;
  'terminal:resize': (sessionId: string, cols: number, rows: number) => void;
  'terminal:kill': (sessionId: string) => void;
  'terminal:list': () => void;
  'chat:create': (options: ChatCreateOptions) => void;
  'chat:send': (sessionId: string, message: string) => void;
  'chat:allow-tool': (sessionId: string, toolName: string) => void;
  'chat:abort': (sessionId: string) => void;
  'chat:kill': (sessionId: string) => void;
  'orchestrator:create': (options: OrchestratorCreateOptions) => void;
  'orchestrator:dispatch': (orchId: string, tasks: SubTask[]) => void;
  'orchestrator:synthesize': (orchId: string) => void;
  'orchestrator:abort': (orchId: string) => void;
  'orchestrator:kill': (orchId: string) => void;
  'orchestrator:retry-worker': (orchId: string, workerId: string) => void;
}

/**
 * Socket events for server -> client
 */
export interface ServerToClientEvents {
  'terminal:created': (sessionId: string, pid: number) => void;
  'terminal:data': (sessionId: string, data: string) => void;
  'terminal:exit': (sessionId: string, exitCode: number) => void;
  'terminal:list': (sessionIds: string[]) => void;
  'terminal:error': (message: string) => void;
  'chat:created': (sessionId: string, provider: string) => void;
  'chat:event': (sessionId: string, event: ChatStreamEvent) => void;
  'chat:complete': (sessionId: string, stats: ChatStats) => void;
  'chat:error': (sessionId: string, message: string) => void;
  'chat:exit': (sessionId: string) => void;
  'orchestrator:created': (orchId: string, coordinatorId: string, provider: string) => void;
  'orchestrator:dispatched': (orchId: string, workers: WorkerInfo[]) => void;
  'orchestrator:worker-event': (orchId: string, workerId: string, event: ChatStreamEvent) => void;
  'orchestrator:worker-complete': (orchId: string, workerId: string, result: WorkerInfo) => void;
  'orchestrator:all-complete': (orchId: string, results: WorkerInfo[]) => void;
  'orchestrator:status': (orchId: string, status: OrchestratorStatus) => void;
  'orchestrator:merge-error': (orchId: string, workerId: string, error: string) => void;
  'orchestrator:error': (orchId: string, message: string) => void;
  'system:capabilities': (capabilities: SystemCapabilities) => void;
}
