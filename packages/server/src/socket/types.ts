/**
 * Socket.io types and interfaces
 */

import type { Server as SocketIOServer, Socket } from 'socket.io';
import type { TerminalManager } from '../terminal/types';

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
}

/**
 * Socket handler configuration
 */
export interface SocketHandlerConfig {
  /** Terminal manager instance */
  terminalManager: TerminalManager;
}

/**
 * Socket handler interface
 */
export interface SocketHandler {
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

  /**
   * Get the Socket.io server instance
   */
  getIO(): SocketIOServer;
}
