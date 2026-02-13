import type { IPty } from 'node-pty';
import { vi } from 'vitest';

/**
 * Mock IPty implementation for testing
 */
class MockPty implements IPty {
  pid: number = Math.floor(Math.random() * 10000) + 1000;
  cols: number = 80;
  rows: number = 24;
  process: string = 'bash';
  handleFlowControl: boolean = false;

  private dataHandlers: ((data: string) => void)[] = [];
  private exitHandlers: ((event: { exitCode: number; signal?: number }) => void)[] = [];
  private _killed: boolean = false;

  onData(handler: (data: string) => void): { dispose: () => void } {
    this.dataHandlers.push(handler);
    return { dispose: () => {} };
  }

  onExit(handler: (event: { exitCode: number; signal?: number }) => void): { dispose: () => void } {
    this.exitHandlers.push(handler);
    return { dispose: () => {} };
  }

  write(data: string): void {
    if (!this._killed) {
      // Simulate echo back
      setTimeout(() => {
        for (const handler of this.dataHandlers) handler(data);
      }, 10);
    }
  }

  resize(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
  }

  kill(_signal?: string): void {
    if (!this._killed) {
      this._killed = true;
      setTimeout(() => {
        for (const handler of this.exitHandlers) handler({ exitCode: 0 });
      }, 10);
    }
  }

  pause(): void {}
  resume(): void {}
  clear(): void {}

  // Expose for testing
  _emitData(data: string): void {
    for (const handler of this.dataHandlers) handler(data);
  }

  _emitExit(exitCode: number): void {
    this._killed = true;
    for (const handler of this.exitHandlers) handler({ exitCode });
  }
}

export const spawn = vi.fn((shell: string, _args?: string[], _options?: any) => {
  // Simulate failure for invalid shell
  if (shell.includes('nonexistent')) {
    throw new Error('posix_spawnp failed.');
  }

  return new MockPty();
});
