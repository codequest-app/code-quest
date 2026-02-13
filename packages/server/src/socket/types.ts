/**
 * Socket.io types and interfaces
 */

import type { Socket, Server as SocketIOServer } from 'socket.io';

export type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';

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
