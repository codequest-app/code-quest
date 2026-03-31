import type { SpawnOptions } from 'node:child_process';
import type { ProcessHandle, ProcessProvider } from '../types.ts';

export class FakeProcessHandle implements ProcessHandle {
  private readonly controller = new AbortController();
  private readonly lineQueue: string[] = [];
  private readonly receivedLines: string[] = [];
  private resolver: ((value: IteratorResult<string>) => void) | null = null;

  /** Optional hook — called when pipeline writes to stdin. Use to auto-respond. */
  onSend?: (raw: string, handle: FakeProcessHandle) => void;

  readonly signal = this.controller.signal;

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

  /** Test reads what client sent to Claude */
  received(): Record<string, unknown>[];
  received(type: string): Record<string, unknown>[];
  received(type?: string): Record<string, unknown>[] {
    const parsed = this.receivedLines.map((r) => JSON.parse(r) as Record<string, unknown>);
    if (!type) return parsed;
    return parsed.filter((l) => l.type === type);
  }

  abort(): void {
    this.controller.abort();
    if (this.resolver) {
      const r = this.resolver;
      this.resolver = null;
      r({ value: undefined, done: true });
    }
  }

  lines: AsyncIterable<string> = {
    [Symbol.asyncIterator]: () => ({
      next: (): Promise<IteratorResult<string>> => {
        // Drain queue first, even if aborted
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
}

export class FakeProcessProvider implements ProcessProvider {
  private readonly handles: FakeProcessHandle[] = [];

  spawn(_command: string, _args: string[], _options?: SpawnOptions): FakeProcessHandle {
    const handle = new FakeProcessHandle();
    this.handles.push(handle);
    return handle;
  }

  get latest(): FakeProcessHandle {
    return this.handles[this.handles.length - 1];
  }

  get all(): FakeProcessHandle[] {
    return this.handles;
  }
}
