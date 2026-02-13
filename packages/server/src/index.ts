/**
 * Code Quest Server
 * Terminal management server with HTTP API and WebSocket support
 */

// Re-export HTTP schema types
export type {
  CreateTerminalRequest,
  CreateTerminalResponse,
  ErrorResponse,
  HealthResponse,
  TerminalInfoResponse,
  TerminalListResponse,
} from './http/schemas.ts';
// Re-export HTTP internal types
export type { HttpServer, HttpServerConfig } from './http/types.ts';
export { ServerImpl } from './server.ts';
// Re-export Socket types
export type { SocketHandler } from './socket/types.ts';
// Re-export terminal types
export type {
  TerminalDimensions,
  TerminalManager,
  TerminalSession,
  TerminalSessionOptions,
} from './terminal/types.ts';
export type { Server, ServerConfig, ServerStatus } from './types.ts';
