import type { ChildProcess, SpawnOptions } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';

/**
 * MockProcess for unit testing ChatSessionImpl without spawning real processes.
 * Implements the ChildProcess interface subset used by ChatSessionImpl.
 */
export class MockProcess extends EventEmitter {
  readonly stdin = new PassThrough();
  readonly stdout = new PassThrough();
  readonly stderr = new PassThrough();
  readonly pid = 12345;

  private stdinChunks: string[] = [];
  private killed = false;

  constructor() {
    super();
    this.stdin.on('data', (chunk: Buffer) => {
      this.stdinChunks.push(chunk.toString());
    });
  }

  kill(signal?: string): boolean {
    this.killed = true;
    if (signal === 'SIGINT' || signal === 'SIGTERM') {
      // Simulate process close
      process.nextTick(() => {
        this.emit('close', signal === 'SIGINT' ? 130 : 143);
      });
    }
    return true;
  }

  /** Emit data on stdout (simulates CLI output) */
  emitStdout(data: string): void {
    this.stdout.push(`${data}\n`);
  }

  /** Emit data on stderr */
  emitStderr(data: string): void {
    this.stderr.push(data);
  }

  /** Simulate process close event */
  emitClose(code: number): void {
    this.emit('close', code);
  }

  /** Simulate process error event */
  emitError(error: Error): void {
    this.emit('error', error);
  }

  /** Get all data written to stdin */
  getStdinData(): string {
    return this.stdinChunks.join('');
  }

  /** Get latest stdin line */
  getLastStdinLine(): string {
    const all = this.getStdinData();
    const lines = all.trim().split('\n');
    return lines[lines.length - 1] ?? '';
  }

  /** Check if process was killed */
  get isKilled(): boolean {
    return this.killed;
  }
}

/**
 * Tracks spawned processes and the args they were called with.
 * For spawn-per-message model where each sendMessage creates a new process.
 */
export interface SpawnRecord {
  command: string;
  args: string[];
  options: SpawnOptions;
  process: MockProcess;
}

/**
 * Creates a processFactory that returns MockProcess instances.
 * Tracks all spawn calls for assertion.
 */
export function createMockProcessFactory(mockProcessOrGetter: MockProcess | (() => MockProcess)) {
  const records: SpawnRecord[] = [];

  const factory = (command: string, args: string[], options: SpawnOptions) => {
    const proc =
      typeof mockProcessOrGetter === 'function' ? mockProcessOrGetter() : mockProcessOrGetter;
    records.push({ command, args, options, process: proc });
    return proc as unknown as ChildProcess;
  };

  factory.records = records;
  return factory;
}
