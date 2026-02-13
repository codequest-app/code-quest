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
} from './http/types.ts';
export { ServerImpl } from './server.ts';
// Re-export Socket types
export type { ClientToServerEvents, ServerToClientEvents, SocketHandler } from './socket/types.ts';
// Re-export terminal types
export type {
  TerminalDimensions,
  TerminalManager,
  TerminalSession,
  TerminalSessionOptions,
} from './terminal/types.ts';
export type { Server, ServerConfig, ServerStatus } from './types.ts';
