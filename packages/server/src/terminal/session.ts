import * as pty from 'node-pty';
import { randomBytes } from 'crypto';
import type { TerminalSession, TerminalSessionOptions, TerminalDimensions } from './types';

/**
 * Terminal session implementation using node-pty
 */
export class TerminalSessionImpl implements TerminalSession {
  private readonly _id: string;
  private readonly _ptyProcess: pty.IPty;
  private _isAlive: boolean = true;
  private readonly dataCallbacks: Set<(data: string) => void> = new Set();
  private readonly exitCallbacks: Set<(exitCode: number) => void> = new Set();

  constructor(options?: TerminalSessionOptions) {
    // Generate unique session ID
    this._id = randomBytes(16).toString('hex');

    // Determine shell to use
    const shell = options?.shell || (process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/bash');
    const cwd = options?.cwd || process.cwd();

    // Spawn PTY process
    try {
      this._ptyProcess = pty.spawn(shell, options?.args || [], {
        name: 'xterm-color',
        cols: options?.cols || 80,
        rows: options?.rows || 24,
        cwd: cwd,
        env: { ...process.env, ...options?.env } as Record<string, string>,
      });

      // Set up data handler
      this._ptyProcess.onData((data) => {
        this.dataCallbacks.forEach((callback) => callback(data));
      });

      // Set up exit handler
      this._ptyProcess.onExit(({ exitCode }) => {
        this._isAlive = false;
        this.exitCallbacks.forEach((callback) => callback(exitCode));
      });
    } catch (error) {
      throw new Error(`Failed to spawn terminal: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  get id(): string {
    return this._id;
  }

  get pid(): number {
    return this._ptyProcess.pid;
  }

  get isAlive(): boolean {
    return this._isAlive;
  }

  write(data: string): void {
    if (this._isAlive) {
      this._ptyProcess.write(data);
    }
  }

  resize(dimensions: TerminalDimensions): void {
    if (this._isAlive) {
      this._ptyProcess.resize(dimensions.cols, dimensions.rows);
    }
  }

  kill(): void {
    if (this._isAlive) {
      try {
        this._ptyProcess.kill();
      } catch (error) {
        // Ignore errors when killing
        console.warn('Error killing PTY:', error);
      }
      this._isAlive = false;
    }
  }

  onData(callback: (data: string) => void): void {
    this.dataCallbacks.add(callback);
  }

  onExit(callback: (exitCode: number) => void): void {
    this.exitCallbacks.add(callback);
  }
}
