/**
 * Terminal session types and interfaces
 */

export interface TerminalSessionOptions {
  /** Shell command to execute (defaults to user's shell) */
  shell?: string;
  /** Arguments to pass to the shell */
  args?: string[];
  /** Working directory for the terminal */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Terminal columns */
  cols?: number;
  /** Terminal rows */
  rows?: number;
}

export interface TerminalDimensions {
  cols: number;
  rows: number;
}

export interface TerminalSession {
  /** Unique session ID */
  readonly id: string;
  /** Process ID of the spawned shell */
  readonly pid: number;
  /** Whether the session is still active */
  readonly isAlive: boolean;

  /**
   * Write data to the terminal
   * @param data Data to write
   */
  write(data: string): void;

  /**
   * Resize the terminal
   * @param dimensions New terminal dimensions
   */
  resize(dimensions: TerminalDimensions): void;

  /**
   * Kill the terminal session
   */
  kill(): void;

  /**
   * Register a callback for terminal output
   * @param callback Function to call when data is received
   */
  onData(callback: (data: string) => void): void;

  /**
   * Register a callback for terminal exit
   * @param callback Function to call when terminal exits
   */
  onExit(callback: (exitCode: number) => void): void;
}

export interface TerminalManager {
  /**
   * Create a new terminal session
   * @param options Session options
   * @returns The created terminal session
   */
  createSession(options?: TerminalSessionOptions): TerminalSession;

  /**
   * Get a terminal session by ID
   * @param id Session ID
   * @returns The terminal session, or undefined if not found
   */
  getSession(id: string): TerminalSession | undefined;

  /**
   * Remove a terminal session
   * @param id Session ID
   * @returns True if session was removed, false if not found
   */
  removeSession(id: string): boolean;

  /**
   * List all active terminal sessions
   * @returns Array of session IDs
   */
  listSessions(): string[];

  /**
   * Clean up all terminal sessions
   */
  cleanup(): void;
}
