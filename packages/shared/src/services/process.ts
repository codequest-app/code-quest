import type { SpawnOptions } from 'node:child_process';

export interface ProcessHandle {
  lines: AsyncIterable<string>;
  stderr?: AsyncIterable<string>;
  send(raw: string): void;
  signal: AbortSignal;
  abort(): void;
}

export interface ProcessRunResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

export interface ProcessProvider {
  spawn(command: string, args: string[], options?: SpawnOptions): ProcessHandle;
  runOnce(command: string, args: string[], options?: SpawnOptions): Promise<ProcessRunResult>;
}
