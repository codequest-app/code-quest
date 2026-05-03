import { z } from 'zod';
import { logger } from '../logger.ts';
import { ResumableSocket } from './resumable-socket.ts';
import type { TypedSocket } from './types.ts';
import { RESUME_EVENT } from './ws-transport.ts';

const ResumePayloadSchema = z.object({ lastSeq: z.number().optional() }).optional();

/**
 * Anything that can hand back the long-lived session identifier for a
 * TypedSocket it produced. WsTransport reads this from the upgrade URL
 * `?sessionKey=…`; future transports (SSE, WebTransport) plug in by
 * implementing the same interface.
 */
export interface SessionKeyResolver {
  sessionKeyFor(socket: TypedSocket): string | undefined;
}

/**
 * Emitted when a client's `lastSeq` falls outside the server's replay buffer.
 * The client SHOULD treat this as a signal to drop local state and re-fetch
 * from scratch, since the server can no longer fill the gap.
 */
export const STATE_REFRESH_REQUIRED_EVENT = 'state:refresh_required';

export interface RegistryOptions {
  resolver: SessionKeyResolver;
  bufferSize?: number;
}

/**
 * Sits between the bare WsTransport's `onConnection` callback and the upper
 * layer (`ChannelEmitter.handleConnection`). For each new TypedSocket:
 *
 *   - Reads its sessionKey via `resolver.sessionKeyFor(socket)`.
 *   - If the sessionKey is unknown, creates a fresh `ResumableSocket`
 *     wrapping the transport socket; otherwise rebinds the existing
 *     `ResumableSocket` to the new transport socket so the seq counter
 *     and ring buffer survive reconnect.
 *   - Subscribes to the transport's synthetic `RESUME_EVENT`; on receipt,
 *     calls `resumable.resume(lastSeq)` to replay missed events through
 *     the rebound inner.
 *   - Anonymous (no sessionKey) connections get a fresh ResumableSocket
 *     that lives for the connection's lifetime; replay is impossible
 *     across reconnects, but local seq + buffer still work.
 *
 * The wrapped socket returned by `acceptOrRebind` is what the rest of the
 * server (ChannelEmitter, handlers) sees as `TypedSocket`.
 */
export class ResumableConnectionRegistry {
  private readonly bySession = new Map<string, ResumableSocket>();
  private readonly resolver: SessionKeyResolver;
  private readonly bufferSize?: number;

  constructor(opts: RegistryOptions) {
    this.resolver = opts.resolver;
    this.bufferSize = opts.bufferSize;
  }

  acceptOrRebind(socket: TypedSocket): TypedSocket {
    const sessionKey = this.resolver.sessionKeyFor(socket);

    let resumable: ResumableSocket;
    const existing = sessionKey ? this.bySession.get(sessionKey) : undefined;
    if (existing) {
      resumable = existing;
      resumable.rebind(socket);
      logger.debug({ sessionKey }, 'resumable socket rebound');
    } else {
      resumable = new ResumableSocket(socket, { bufferSize: this.bufferSize });
      if (sessionKey) this.bySession.set(sessionKey, resumable);
    }

    socket.on(RESUME_EVENT, (...args) => {
      const payload = ResumePayloadSchema.parse(args[0]);
      const lastSeq = payload?.lastSeq ?? 0;
      const result = resumable.resume(lastSeq);
      if (result.kind === 'gap') {
        logger.warn({ sessionKey, lastSeq }, 'resume gap; client should refresh');
        // Route through `resumable` (NOT the inner adapter) so the refresh
        // notice gets a seq matching what the client will track. Bypassing
        // the wrapper here would advance the adapter's seq past the
        // resumable's, leaving any subsequent buffered emit at a seq the
        // client thinks it already has — silent data loss on next resume.
        // The wasted buffer slot is fine; refresh is rare and idempotent.
        resumable.emit(STATE_REFRESH_REQUIRED_EVENT, {});
      }
    });

    return resumable;
  }

  /** Drop all stored resumable sockets. */
  clear(): void {
    this.bySession.clear();
  }

  /** Test introspection. */
  size(): number {
    return this.bySession.size;
  }
}
