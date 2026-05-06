import type { SpawnOptions } from 'node:child_process';
import type { z } from 'zod';
import type { controlRequestSchema, userSchema } from '../claude/schemas.ts';
import type { ProcessHandle, ProcessProvider, ProcessRunResult } from '../types.ts';

/** Type map for messages tests inspect via `received(type)`. Each is a CLI
 *  stdin message the server sends to the runner. */
export interface ReceivedMessageMap {
  control_request: z.infer<typeof controlRequestSchema>;
  control_response: {
    type: 'control_response';
    response: { request_id: string; subtype?: string; [k: string]: unknown };
  };
  user: z.infer<typeof userSchema>;
  start_speech_to_text: { type: 'start_speech_to_text'; channelId: string };
  stop_speech_to_text: { type: 'stop_speech_to_text'; channelId: string };
}

export class FakeProcessHandle implements ProcessHandle {
  private readonly controller = new AbortController();
  private readonly lineQueue: string[] = [];
  private readonly stderrQueue: string[] = [];
  private readonly receivedLines: string[] = [];
  private resolver: ((value: IteratorResult<string>) => void) | null = null;
  private stderrResolver: ((value: IteratorResult<string>) => void) | null = null;

  /** Optional hook — called when pipeline writes to stdin. Use to auto-respond. */
  onSend?: (raw: string, handle: FakeProcessHandle) => void;

  readonly signal: AbortSignal = this.controller.signal;

  /** Test pushes a raw line (segment string) — appears in lines iterable */
  emit(line: string): void {
    if (this.resolver) {
      const r = this.resolver;
      this.resolver = null;
      r({ value: line, done: false });
    } else {
      this.lineQueue.push(line);
    }
  }

  /** Pipeline calls this — test reads via received() */
  send(raw: string): void {
    this.receivedLines.push(raw);
    this.onSend?.(raw, this);
  }

  /** Test reads what client sent to Claude (the CLI runner's stdin). */
  received(): Array<Record<string, unknown>>;
  received<T extends keyof ReceivedMessageMap>(type: T): Array<ReceivedMessageMap[T]>;
  received(type: string): Array<Record<string, unknown>>;
  received(type?: string): Array<Record<string, unknown>> {
    const parsed = this.receivedLines.map((r) => JSON.parse(r) as Record<string, unknown>);
    if (!type) return parsed;
    return parsed.filter((l) => l.type === type);
  }

  emitStderr(line: string): void {
    if (this.stderrResolver) {
      const r = this.stderrResolver;
      this.stderrResolver = null;
      r({ value: line, done: false });
    } else {
      this.stderrQueue.push(line);
    }
  }

  abort(exitCode?: number): void {
    this.controller.abort(exitCode);
    if (this.resolver) {
      const r = this.resolver;
      this.resolver = null;
      r({ value: undefined, done: true });
    }
    if (this.stderrResolver) {
      const r = this.stderrResolver;
      this.stderrResolver = null;
      r({ value: undefined, done: true });
    }
  }

  lines: AsyncIterable<string> = {
    [Symbol.asyncIterator]: () => ({
      next: (): Promise<IteratorResult<string>> => {
        if (this.lineQueue.length > 0) {
          return Promise.resolve({ value: this.lineQueue.shift()!, done: false });
        }
        if (this.signal.aborted) {
          return Promise.resolve({ value: undefined, done: true });
        }
        return new Promise<IteratorResult<string>>((resolve) => {
          this.resolver = resolve;
        });
      },
    }),
  };

  stderr: AsyncIterable<string> = {
    [Symbol.asyncIterator]: () => ({
      next: (): Promise<IteratorResult<string>> => {
        if (this.stderrQueue.length > 0) {
          return Promise.resolve({ value: this.stderrQueue.shift()!, done: false });
        }
        if (this.signal.aborted) {
          return Promise.resolve({ value: undefined, done: true });
        }
        return new Promise<IteratorResult<string>>((resolve) => {
          this.stderrResolver = resolve;
        });
      },
    }),
  };
}

interface SpawnCall {
  command: string;
  args: string[];
  options?: SpawnOptions;
}

export class FakeProcessProvider implements ProcessProvider {
  private readonly handles: FakeProcessHandle[] = [];
  private readonly _spawnCalls: SpawnCall[] = [];
  private readonly _runOnceCalls: SpawnCall[] = [];
  /** Queued responses for `runOnce`; defaults to `{exitCode:0, stdout:'', stderr:''}` when empty. */
  private readonly runOnceResponses: ProcessRunResult[] = [];

  get spawnCalls(): ReadonlyArray<SpawnCall> {
    return this._spawnCalls;
  }

  get runOnceCalls(): ReadonlyArray<SpawnCall> {
    return this._runOnceCalls;
  }

  /** Push a canned response for the next `runOnce` call. FIFO order. */
  enqueueRunOnce(result: ProcessRunResult): void {
    this.runOnceResponses.push(result);
  }

  spawn(command: string, args: string[], options?: SpawnOptions): FakeProcessHandle {
    this._spawnCalls.push({ command, args, options });
    const handle = new FakeProcessHandle();
    this.handles.push(handle);
    return handle;
  }

  async runOnce(
    command: string,
    args: string[],
    options?: SpawnOptions,
  ): Promise<ProcessRunResult> {
    this._runOnceCalls.push({ command, args, options });
    return this.runOnceResponses.shift() ?? { exitCode: 0, stdout: '', stderr: '' };
  }

  get latest(): FakeProcessHandle {
    return this.handles[this.handles.length - 1]!;
  }

  get all(): FakeProcessHandle[] {
    return this.handles;
  }
}
