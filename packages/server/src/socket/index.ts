/**
 * Socket.io module
 * Provides WebSocket communication for terminal sessions
 */

export { SocketHandlerImpl } from './handler.ts';
export type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketHandler,
  SocketHandlerConfig,
} from './types.ts';
