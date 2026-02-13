/**
 * HTTP API module
 * Provides REST API endpoints for terminal management
 */

export type {
  CreateTerminalRequest,
  CreateTerminalResponse,
  ErrorResponse,
  HealthResponse,
  TerminalInfoResponse,
  TerminalListResponse,
} from './schemas.ts';
export { HttpServerImpl } from './server.ts';
export type { HttpServer, HttpServerConfig } from './types.ts';
