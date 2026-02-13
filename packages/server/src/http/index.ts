/**
 * HTTP API module
 * Provides REST API endpoints for terminal management
 */

export { HttpServerImpl } from './server';
export type {
  CreateTerminalRequest,
  CreateTerminalResponse,
  ErrorResponse,
  HealthResponse,
  HttpServer,
  HttpServerConfig,
  TerminalInfoResponse,
  TerminalListResponse,
} from './types';
