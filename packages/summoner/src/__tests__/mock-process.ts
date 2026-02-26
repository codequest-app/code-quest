import type { SpawnOptions } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';

export class MockProcess extends EventEmitter {
  readonly stdin = new PassThrough();
  readonly stdout = new PassThrough();
  readonly stderr = new PassThrough();
  pid = 12345;
  killed = false;
  lastSignal: string | undefined;

  kill(signal?: string): boolean {
    this.killed = true;
    this.lastSignal = signal;
    // Real processes emit close with null code and signal name when killed
    this.emit('close', null, signal ?? null);
    return true;
  }

  emitLine(json: object): void {
    this.stdout.write(`${JSON.stringify(json)}\n`);
  }

  emitClose(code = 0): void {
    this.stdout.end();
    this.stderr.end();
    this.emit('close', code, null);
  }
}

export interface SpawnCall {
  command: string;
  args: string[];
  options: SpawnOptions;
}

export function createMockProcessFactory() {
  const processes: MockProcess[] = [];
  const spawnCalls: SpawnCall[] = [];

  const factory = ((command: string, args: string[], options: SpawnOptions) => {
    spawnCalls.push({ command, args, options });
    const proc = new MockProcess();
    processes.push(proc);
    return proc;
  }) as unknown as import('../types.ts').ProcessFactory;

  return {
    factory,
    processes,
    spawnCalls,
    get latest() {
      return processes[processes.length - 1];
    },
  };
}
