import type { TypedSocket } from './types.ts';

interface BufferedEvent {
  seq: number;
  event: string;
  args: unknown[];
}

interface ResumableSocketOptions {
  /** Max retained outbound events. Default 500. */
  bufferSize?: number;
}

type ResumeResult = { kind: 'ok'; replayed: number } | { kind: 'gap' };

/**
 * ResumableSocket wraps any TypedSocket and provides:
 *   - monotonic outbound seq numbering
 *   - bounded ring buffer of recent outbound events (default 500)
 *   - replay via `resume(lastSeq)` for reconnect scenarios
 *   - `rebind(newInner)` to swap the inner connection (e.g. on reconnect)
 *     while preserving seq state so the client's `lastSeq` stays valid
 *
 * Transport-agnostic by design: works equally above SocketIoTransport and
 * WsTransport. Replay logic lives in ONE place — every transport benefits.
 */
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

  /**
   * Swap the inner socket. Use after reconnect — new transport-level connection,
   * same logical session. Seq + buffer carry over so `resume()` can pick up where
   * the client left off.
   */
  rebind(newInner: TypedSocket): void {
    this.inner = newInner;
  }

  /**
   * Replay buffered events whose `seq > lastSeq`. Returns `{ kind: 'gap' }` if
   * the buffer no longer retains the requested range (caller should treat as
   * needs-full-refresh). Returns `{ kind: 'ok', replayed }` otherwise.
   */
  resume(lastSeq: number): ResumeResult {
    if (this.buffer.length === 0) return { kind: 'ok', replayed: 0 };

    const oldestRetainedSeq = this.buffer[0]?.seq ?? 0;
    if (lastSeq < oldestRetainedSeq - 1) {
      // Gap: events in (lastSeq, oldestRetainedSeq) have been dropped from the
      // buffer. Caller should signal client to do a full refresh.
      return { kind: 'gap' };
    }

    const toReplay = this.buffer.filter((b) => b.seq > lastSeq);
    for (const b of toReplay) this.inner.emit(b.event, ...b.args);
    return { kind: 'ok', replayed: toReplay.length };
  }

  /** Test introspection — returns the seq numbers currently in the buffer. */
  bufferSeqs(): number[] {
    return this.buffer.map((b) => b.seq);
  }
}
