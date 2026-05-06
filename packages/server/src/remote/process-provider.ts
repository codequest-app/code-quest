import type { SpawnOptions } from 'node:child_process';
import type { ProcessHandle, ProcessProvider, ProcessRunResult } from '@code-quest/shared';
import { REMOTE_METHODS } from '@code-quest/shared';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger.ts';
import type { Connection } from './connection.ts';

const DONE_RESULT: IteratorReturnResult<undefined> = { value: undefined, done: true };

class LineStream implements AsyncIterable<string> {
  readonly stderrLines: string[] = [];
  readonly exitCode: Promise<number | null>;
  private resolveExitCode!: (code: number | null) => void;
  private readonly removeNotification: () => void;

  constructor(conn: Connection, sessionId: string, signal: AbortSignal) {
    this.exitCode = new Promise<number | null>((r) => {
      this.resolveExitCode = r;
    });
    this.removeNotification = conn.onNotification((n) => {
      if (n.method === REMOTE_METHODS.process.stdout) {
        if (n.params.sessionId === sessionId) {
          this.enqueue(n.params.line);
        }
      } else if (n.method === REMOTE_METHODS.process.stderr) {
        if (n.params.sessionId === sessionId) {
          this.stderrLines.push(n.params.line);
        }
      } else if (n.method === REMOTE_METHODS.process.exit) {
        if (n.params.sessionId === sessionId) {
          this.finish(n.params.code);
        }
      }
    });

    const onAbort = () => this.finish(null);
    signal.addEventListener('abort', onAbort);
    this.cleanup = () => {
      this.removeNotification();
      signal.removeEventListener('abort', onAbort);
    };

    if (signal.aborted) this.finish(null);
  }

  private queue: string[] = [];
  private done = false;
  private resolve: (() => void) | null = null;
  private cleanup: () => void;

  private enqueue(line: string): void {
    this.queue.push(line);
    this.resolve?.();
    this.resolve = null;
  }

  private finish(code: number | null): void {
    this.done = true;
    this.resolveExitCode(code);
    this.resolve?.();
    this.resolve = null;
  }

  [Symbol.asyncIterator](): AsyncIterator<string> {
    return {
      next: async () => {
        while (this.queue.length === 0 && !this.done) {
          await new Promise<void>((r) => {
            this.resolve = r;
          });
        }
        if (this.queue.length > 0) {
          return { value: this.queue.shift() as string, done: false };
        }
        this.cleanup();
        return DONE_RESULT;
      },
      return: () => {
        this.done = true;
        this.resolveExitCode(null);
        this.cleanup();
        return Promise.resolve(DONE_RESULT);
      },
    };
  }
}

export class RemoteProcessProvider implements ProcessProvider {
  private readonly connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  spawn(command: string, args: string[], options?: SpawnOptions): ProcessHandle {
    const { sessionId, controller, conn } = this.initSession();
    const stream = new LineStream(conn, sessionId, controller.signal);

    this.fireSpawn(sessionId, command, args, options, controller);

    return {
      lines: stream,
      signal: controller.signal,
      send(raw: string): void {
        conn.request(REMOTE_METHODS.process.stdin, { sessionId, data: raw }).catch((e) => {
          logger.warn({ err: e, sessionId }, 'process/stdin failed');
        });
      },
      abort(): void {
        controller.abort();
        conn.request(REMOTE_METHODS.process.kill, { sessionId }).catch((e) => {
          logger.warn({ err: e, sessionId }, 'process/kill failed');
        });
      },
    };
  }

  async runOnce(
    command: string,
    args: string[],
    options?: SpawnOptions,
  ): Promise<ProcessRunResult> {
    const { sessionId, controller, conn } = this.initSession();
    const stream = new LineStream(conn, sessionId, controller.signal);

    this.fireSpawn(sessionId, command, args, options, controller);

    const collected: string[] = [];
    for await (const line of stream) {
      collected.push(line);
    }
    const code = await stream.exitCode;
    return { exitCode: code, stdout: collected.join('\n'), stderr: stream.stderrLines.join('\n') };
  }

  private initSession() {
    if (!this.connection.isOpen) {
      throw new Error('No remote daemon connected');
    }
    return {
      sessionId: uuidv4(),
      controller: new AbortController(),
      conn: this.connection,
    };
  }

  private fireSpawn(
    sessionId: string,
    command: string,
    args: string[],
    options: SpawnOptions | undefined,
    controller: AbortController,
  ): void {
    this.connection
      .request<{ ok: true }>(REMOTE_METHODS.process.spawn, {
        sessionId,
        command,
        args,
        cwd: options?.cwd?.toString(),
        env: options?.env as Record<string, string> | undefined,
      })
      .catch((e) => {
        logger.warn({ err: e, sessionId }, 'process/spawn failed');
        controller.abort();
      });
  }
}
