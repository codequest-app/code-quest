/**
 * Socket.io module
 * Provides WebSocket communication for terminal sessions
 */

export { SocketHandlerImpl } from './handler';
export type {
  SocketHandler,
  SocketHandlerConfig,
  ClientToServerEvents,
  ServerToClientEvents,
} from './types';
