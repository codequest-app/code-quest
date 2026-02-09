/**
 * Code Quest Server
 * Terminal management server with HTTP API and WebSocket support
 */

export { ServerImpl } from './server';
export type { Server, ServerConfig, ServerStatus } from './types';

// Re-export terminal types
export type {
  TerminalSession,
  TerminalManager,
  TerminalSessionOptions,
  TerminalDimensions,
} from './terminal/types';

// Re-export HTTP types
export type {
  HttpServer,
  HttpServerConfig,
  HealthResponse,
  TerminalListResponse,
  CreateTerminalRequest,
  CreateTerminalResponse,
  TerminalInfoResponse,
  ErrorResponse,
} from './http/types';

// Re-export Socket types
export type {
  SocketHandler,
  SocketHandlerConfig,
  ClientToServerEvents,
  ServerToClientEvents,
} from './socket/types';
