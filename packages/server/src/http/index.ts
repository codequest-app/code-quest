/**
 * HTTP API module
 * Provides REST API endpoints for terminal management
 */

export { HttpServerImpl } from './server';
export type {
  HttpServer,
  HttpServerConfig,
  HealthResponse,
  TerminalListResponse,
  CreateTerminalRequest,
  CreateTerminalResponse,
  TerminalInfoResponse,
  ErrorResponse,
} from './types';
