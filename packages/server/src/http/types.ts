/**
 * HTTP API types and interfaces
 */

import type { TerminalManager } from '../terminal/types.ts';

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
