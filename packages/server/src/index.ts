/**
 * Code Quest Server
 * Terminal management server with HTTP API and WebSocket support
 */

// Re-export HTTP types
export type {
  CreateTerminalRequest,
  CreateTerminalResponse,
  ErrorResponse,
  HealthResponse,
  HttpServer,
  HttpServerConfig,
  TerminalInfoResponse,
  TerminalListResponse,
} from './http/types';
export { ServerImpl } from './server';
// Re-export Socket types
export type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketHandler,
  SocketHandlerConfig,
} from './socket/types';
// Re-export terminal types
export type {
  TerminalDimensions,
  TerminalManager,
  TerminalSession,
  TerminalSessionOptions,
} from './terminal/types';
export type { Server, ServerConfig, ServerStatus } from './types';
