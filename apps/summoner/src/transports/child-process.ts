import { type SpawnOptions, spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import type { ProcessHandle, ProcessProvider, ProcessRunResult } from '@code-quest/shared';
import { logger } from '../logger.ts';

export class ChildProcessProvider implements ProcessProvider {
  spawn(command: string, args: string[], options?: SpawnOptions): ProcessHandle {
    const controller = new AbortController();

    const spawnOpts: SpawnOptions = {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options,
    };
    const proc = spawn(command, args, spawnOpts);

    // ENOENT/EACCES from spawn arrives as an 'error' event. With no listener,
    // Node treats it as unhandled and crashes the process. Abort so the
    // readline iterable ends cleanly and downstream callers see a normal
    // "stream finished" rather than a process crash.
    proc.on('error', (err) => {
      // Log so operators can distinguish 'CLI not installed' (ENOENT) from
      // a normal exit with no output — both look identical downstream.
      logger.error({ err, command }, '[ChildProcessProvider] spawn error');
      if (!controller.signal.aborted) controller.abort();
    });

    proc.on('close', (code) => {
      if (!controller.signal.aborted) controller.abort(code);
    });

    const stdout = proc.stdout;
    if (!stdout) throw new Error('stdout not available — spawn must use stdio: pipe');
    const lines = this.createLineIterable(stdout, controller.signal);
    const stderr = proc.stderr
      ? this.createLineIterable(proc.stderr, controller.signal)
      : undefined;

    const send = (raw: string): void => {
      proc.stdin?.write(`${raw}\n`);
    };

    const abort = (): void => {
      if (controller.signal.aborted) return;
      controller.abort();
      proc.kill('SIGTERM');
      setTimeout(() => {
        if (!proc.killed) proc.kill('SIGKILL');
      }, 5_000).unref();
    };

    return { lines, stderr, send, signal: controller.signal, abort };
  }

  private async *createLineIterable(
    stream: NodeJS.ReadableStream,
    signal: AbortSignal,
  ): AsyncIterable<string> {
    const rl = createInterface({ input: stream });
    try {
      for await (const line of rl) {
        if (signal.aborted) break;
        yield line;
      }
    } finally {
      rl.close();
    }
  }

  runOnce(command: string, args: string[], options?: SpawnOptions): Promise<ProcessRunResult> {
    const proc = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
    return new Promise<ProcessRunResult>((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      proc.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf-8');
      });
      proc.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString('utf-8');
      });
      proc.on('error', reject);
      proc.on('close', (code) => {
        resolve({ exitCode: code, stdout, stderr });
      });
    });
  }
}
