import type { TypedSocket } from '@code-quest/schemas';

interface BufferedEvent {
  seq: number;
  event: string;
  args: unknown[];
}

export interface ResumableSocketOptions {
  bufferSize?: number;
}

export type ResumeResult = { kind: 'ok'; replayed: number } | { kind: 'gap' };

export class ResumableSocket implements TypedSocket {
  private inner: TypedSocket;
  private readonly bufferSize: number;
  private buffer: BufferedEvent[] = [];
  private nextSeq = 0;

  constructor(inner: TypedSocket, opts: ResumableSocketOptions = {}) {
    this.inner = inner;
    this.bufferSize = opts.bufferSize ?? 500;
  }

  get id(): string {
    return this.inner.id;
  }

  emit(event: string, ...args: unknown[]): void {
    const seq = ++this.nextSeq;
    this.buffer.push({ seq, event, args });
    if (this.buffer.length > this.bufferSize) this.buffer.shift();
    this.inner.emit(event, ...args);
  }

  on(event: string, listener: (...args: unknown[]) => void): void {
    this.inner.on(event, listener);
  }

  rebind(newInner: TypedSocket): void {
    this.inner = newInner;
  }

  resume(lastSeq: number): ResumeResult {
    if (this.buffer.length === 0) return { kind: 'ok', replayed: 0 };

    const oldestRetainedSeq = this.buffer[0]?.seq ?? 0;
    if (lastSeq < oldestRetainedSeq - 1) {
      return { kind: 'gap' };
    }

    const startIdx = this.buffer.findIndex((b) => b.seq > lastSeq);
    if (startIdx === -1) return { kind: 'ok', replayed: 0 };
    const toReplay = this.buffer.slice(startIdx);
    for (const b of toReplay) this.inner.emit(b.event, ...b.args);
    return { kind: 'ok', replayed: toReplay.length };
  }

  bufferSeqs(): number[] {
    return this.buffer.map((b) => b.seq);
  }
}
