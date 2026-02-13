/**
 * Socket.io types and interfaces
 */

import type { Socket, Server as SocketIOServer } from 'socket.io';
import type { ChatProvider, ChatStats, ChatStreamEvent } from '../chat/types.ts';
import type { OrchestratorStatus, SubTask, WorkerInfo } from '../orchestrator/types.ts';

/**
 * Socket events for client -> server
 */
export interface ClientToServerEvents {
  /** Create a new terminal session */
  'terminal:create': (options?: {
    shell?: string;
    args?: string[];
    cwd?: string;
    cols?: number;
    rows?: number;
  }) => void;

  /** Write data to terminal */
  'terminal:write': (sessionId: string, data: string) => void;

  /** Resize terminal */
  'terminal:resize': (sessionId: string, cols: number, rows: number) => void;

  /** Kill terminal session */
  'terminal:kill': (sessionId: string) => void;

  /** List all terminal sessions */
  'terminal:list': () => void;

  /** Create a new chat session */
  'chat:create': (options: { provider: ChatProvider; cwd?: string }) => void;

  /** Send a message to a chat session */
  'chat:send': (sessionId: string, message: string) => void;

  /** Abort the current chat response */
  'chat:abort': (sessionId: string) => void;

  /** Allow a tool for the chat session */
  'chat:allow-tool': (sessionId: string, toolName: string) => void;

  /** Kill a chat session */
  'chat:kill': (sessionId: string) => void;

  /** Create an orchestrator session */
  'orchestrator:create': (options: { provider: ChatProvider }) => void;

  /** Dispatch sub-tasks to workers */
  'orchestrator:dispatch': (orchId: string, tasks: SubTask[]) => void;

  /** Synthesize worker results via coordinator */
  'orchestrator:synthesize': (orchId: string) => void;

  /** Abort orchestrator execution */
  'orchestrator:abort': (orchId: string) => void;

  /** Kill orchestrator session */
  'orchestrator:kill': (orchId: string) => void;
}

/**
 * Socket events for server -> client
 */
export interface ServerToClientEvents {
  /** Terminal session created */
  'terminal:created': (sessionId: string, pid: number) => void;

  /** Terminal data output */
  'terminal:data': (sessionId: string, data: string) => void;

  /** Terminal session exited */
  'terminal:exit': (sessionId: string, exitCode: number) => void;

  /** Terminal session list */
  'terminal:list': (sessionIds: string[]) => void;

  /** Error occurred */
  'terminal:error': (message: string) => void;

  /** Chat session created */
  'chat:created': (sessionId: string, provider: string) => void;

  /** Chat stream event */
  'chat:event': (sessionId: string, event: ChatStreamEvent) => void;

  /** Chat response complete */
  'chat:complete': (sessionId: string, stats: ChatStats) => void;

  /** Chat error */
  'chat:error': (sessionId: string, message: string) => void;

  /** Chat session exited */
  'chat:exit': (sessionId: string) => void;

  /** Orchestrator session created */
  'orchestrator:created': (orchId: string, coordinatorId: string, provider: string) => void;

  /** Orchestrator sub-tasks dispatched */
  'orchestrator:dispatched': (orchId: string, workers: WorkerInfo[]) => void;

  /** Worker stream event forwarded */
  'orchestrator:worker-event': (orchId: string, workerId: string, event: ChatStreamEvent) => void;

  /** Worker completed */
  'orchestrator:worker-complete': (orchId: string, workerId: string, result: WorkerInfo) => void;

  /** All workers completed */
  'orchestrator:all-complete': (orchId: string, results: WorkerInfo[]) => void;

  /** Orchestrator status changed */
  'orchestrator:status': (orchId: string, status: OrchestratorStatus) => void;

  /** Orchestrator error */
  'orchestrator:error': (orchId: string, message: string) => void;
}

export type { OrchestratorStatus, SubTask, WorkerInfo } from '../orchestrator/types.ts';

/**
 * Socket handler interface
 */
export interface SocketHandler {
  /**
   * Attach to a Socket.io server and start handling connections
   * @param io Socket.io server instance
   */
  attach(io: SocketIOServer): void;

  /**
   * Handle new socket connection
   * @param socket Connected socket
   */
  handleConnection(socket: Socket): void;

  /**
   * Handle socket disconnection
   * @param socket Disconnected socket
   */
  handleDisconnection(socket: Socket): void;
}
