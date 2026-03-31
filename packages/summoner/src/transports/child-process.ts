import { type SpawnOptions, spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import type { ProcessHandle, ProcessProvider } from '../types.ts';

export class ChildProcessProvider implements ProcessProvider {
  spawn(command: string, args: string[], options?: SpawnOptions): ProcessHandle {
    const controller = new AbortController();

    const proc = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options,
    } as SpawnOptions);

    // When process exits naturally, abort the controller so readline ends
    proc.on('close', () => {
      if (!controller.signal.aborted) controller.abort();
    });

    const stdout = proc.stdout;
    if (!stdout) throw new Error('stdout not available — spawn must use stdio: pipe');
    const lines = this.createLineIterable(stdout, controller.signal);

    const send = (raw: string): void => {
      proc.stdin?.write(`${raw}\n`);
    };

    const abort = (): void => {
      controller.abort();
      proc.kill('SIGTERM');
    };

    return { lines, send, signal: controller.signal, abort };
  }

  private async *createLineIterable(
    stdout: NodeJS.ReadableStream,
    signal: AbortSignal,
  ): AsyncIterable<string> {
    const rl = createInterface({ input: stdout });
    for await (const line of rl) {
      if (signal.aborted) break;
      yield line;
    }
  }
}
