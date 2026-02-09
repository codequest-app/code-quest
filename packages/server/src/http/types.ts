/**
 * HTTP API types and interfaces
 */

import type { TerminalManager } from '../terminal/types';

/**
 * HTTP server configuration
 */
export interface HttpServerConfig {
  /** Port to listen on */
  port: number;
  /** Terminal manager instance */
  terminalManager: TerminalManager;
  /** Enable CORS */
  cors?: boolean;
}

/**
 * API response for health check
 */
export interface HealthResponse {
  status: 'ok';
  uptime: number;
  timestamp: string;
}

/**
 * API response for terminal list
 */
export interface TerminalListResponse {
  sessions: Array<{
    id: string;
    pid: number;
    isAlive: boolean;
  }>;
}

/**
 * API request body for creating terminal
 */
export interface CreateTerminalRequest {
  shell?: string;
  cwd?: string;
  cols?: number;
  rows?: number;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * API response for creating terminal
 */
export interface CreateTerminalResponse {
  id: string;
  pid: number;
}

/**
 * API response for terminal info
 */
export interface TerminalInfoResponse {
  id: string;
  pid: number;
  isAlive: boolean;
}

/**
 * API error response
 */
export interface ErrorResponse {
  error: string;
  message: string;
}

/**
 * HTTP server interface
 */
export interface HttpServer {
  /**
   * Start the HTTP server
   */
  start(): Promise<void>;

  /**
   * Stop the HTTP server
   */
  stop(): Promise<void>;

  /**
   * Get the server port
   */
  getPort(): number;

  /**
   * Check if server is running
   */
  isRunning(): boolean;
}
