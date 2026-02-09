/**
 * Main server types and interfaces
 */

/**
 * Main server configuration
 */
export interface ServerConfig {
  /** HTTP server port */
  port: number;
  /** Enable CORS */
  cors?: boolean;
}

/**
 * Main server interface
 * Integrates HTTP server, Socket.io, and terminal management
 */
export interface Server {
  /**
   * Start the server (HTTP + Socket.io)
   */
  start(): Promise<void>;

  /**
   * Stop the server and cleanup resources
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

  /**
   * Get server status
   */
  getStatus(): ServerStatus;
}

/**
 * Server status information
 */
export interface ServerStatus {
  running: boolean;
  port: number;
  uptime: number;
  activeSessions: number;
}
