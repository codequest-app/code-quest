import { logger } from '../logger.ts';
import type { Channel } from './channel.ts';
import type { SocketCallback, TypedServer, TypedSocket } from './types.ts';

/** Unified handler signature for all events (runner + client). */
type EmitterHandler = (
  ch: Channel | null,
  payload: unknown,
  socket?: TypedSocket,
  cb?: SocketCallback,
) => void | Promise<void>;

/** Middleware: skip if no channel. */
export function withChannel(
  handler: (ch: Channel, payload: unknown, socket?: TypedSocket, cb?: SocketCallback) => void,
): EmitterHandler {
  return (ch, payload, socket, cb) => {
    if (!ch) return;
    return handler(ch, payload, socket, cb);
  };
}

/** Middleware: if no channel, callback with error instead of skip. */
export function withError(handler: EmitterHandler): EmitterHandler {
  return (ch, payload, socket, cb) => {
    if (!ch) {
      cb?.({ success: false, error: 'Session not found' });
      return;
    }
    return handler(ch, payload, socket, cb);
  };
}

/** Middleware: require both channel and socket. */
export function withSocket(
  handler: (ch: Channel, socket: TypedSocket, payload: unknown, cb?: SocketCallback) => void,
): EmitterHandler {
  return (ch, payload, socket, cb) => {
    if (!ch || !socket) return;
    return handler(ch, socket, payload, cb);
  };
}

export class ChannelEmitter {
  private eventMap = new Map<string, EmitterHandler[]>();

  // ── Socket tracking ──
  private channelSockets = new Map<string, Set<TypedSocket>>();
  private socketChannels = new Map<string, Set<string>>();
  private socketRefs = new Map<string, TypedSocket>();
  private io?: TypedServer;

  // ── Subscribe ──

  on(name: string, handler: EmitterHandler): void {
    const handlers = this.eventMap.get(name) ?? [];
    handlers.push(handler);
    this.eventMap.set(name, handlers);
  }

  // ── Dispatch ──

  /** Dispatch event to all subscribers. Async handler errors are caught and logged. */
  dispatch(
    event: string,
    ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    cb?: SocketCallback,
  ): Promise<void> | void {
    const handlers = this.eventMap.get(event);
    if (!handlers) return;
    const promises: Promise<void>[] = [];
    for (const h of handlers) {
      const result = h(ch, payload, socket, cb);
      if (result instanceof Promise) {
        promises.push(
          result.catch((err) => logger.error({ err, event }, 'Unhandled error in async handler')),
        );
      }
    }
    if (promises.length > 0) {
      return Promise.all(promises).then(() => {});
    }
  }

  /**
   * Dispatch a runner client_message.
   * Auto-broadcasts to channel sockets (except session:init).
   */
  dispatchRunnerMessage(ch: Channel, event: string, payload: unknown): void {
    if (event !== 'session:init') {
      const data = typeof payload === 'object' && payload !== null ? payload : {};
      this.emit(ch.id, event, { channelId: ch.id, ...(data as Record<string, unknown>) });
    }
    this.dispatch(event, ch, payload);
  }

  // ── Emit (broadcast to sockets) ──

  emit(channelId: string, event: string, ...args: unknown[]): void {
    const sockets = this.channelSockets.get(channelId);
    if (!sockets) return;
    for (const sock of sockets) {
      (sock.emit as (...a: unknown[]) => void)(event, ...args);
    }
  }

  emitToOthers(
    channelId: string,
    excludeSocketId: string,
    event: string,
    ...args: unknown[]
  ): void {
    const sockets = this.channelSockets.get(channelId);
    if (!sockets) return;
    for (const sock of sockets) {
      if (sock.id !== excludeSocketId) {
        (sock.emit as (...a: unknown[]) => void)(event, ...args);
      }
    }
  }

  // ── Socket tracking ──

  addSocketToChannel(channelId: string, socket: TypedSocket): void {
    let sockets = this.channelSockets.get(channelId);
    if (!sockets) {
      sockets = new Set();
      this.channelSockets.set(channelId, sockets);
    }
    sockets.add(socket);
    this.socketRefs.set(socket.id, socket);

    let channelIds = this.socketChannels.get(socket.id);
    if (!channelIds) {
      channelIds = new Set();
      this.socketChannels.set(socket.id, channelIds);
    }
    channelIds.add(channelId);
  }

  removeSocketFromAll(socketId: string): Set<string> | undefined {
    const channelIds = this.socketChannels.get(socketId);
    if (!channelIds) return undefined;

    const socket = this.socketRefs.get(socketId);
    if (socket) {
      for (const channelId of channelIds) {
        this.channelSockets.get(channelId)?.delete(socket);
      }
    }

    this.socketChannels.delete(socketId);
    this.socketRefs.delete(socketId);
    return channelIds;
  }

  getSocketCount(channelId: string): number {
    return this.channelSockets.get(channelId)?.size ?? 0;
  }

  // ── Connection handling ──

  handleConnection(
    socket: TypedSocket,
    resolveChannel: (channelId: string) => Channel | undefined,
  ): void {
    // Wire client socket events for emitter.on subscribers only.
    // NOTE: handlers must be registered (emitter.on) before connections are accepted.
    for (const event of this.eventMap.keys()) {
      // socket.io typed emit requires a known event literal; dynamic event names need a cast
      (socket as { on: (event: string, fn: (...args: unknown[]) => void) => void }).on(
        event,
        (...args: unknown[]) => {
          const lastArg = args[args.length - 1];
          const hasCb = typeof lastArg === 'function';
          const cb: SocketCallback | undefined = hasCb ? (lastArg as SocketCallback) : undefined;
          let payload: unknown;
          if (hasCb && args.length > 1) {
            payload = args[0];
          } else if (hasCb) {
            payload = {};
          } else {
            payload = args[0] ?? {};
          }
          const channelId =
            typeof payload === 'object' && payload !== null && 'channelId' in payload
              ? String((payload as Record<string, unknown>).channelId)
              : undefined;
          const ch = channelId ? (resolveChannel(channelId) ?? null) : null;
          return this.dispatch(event, ch, payload, socket, cb);
        },
      );
    }

    socket.on('disconnect', () => {
      this.removeSocketFromAll(socket.id);
    });
  }

  // ── Global broadcast (via io) ──

  register(io: TypedServer): void {
    this.io = io;
  }

  broadcastAll(event: string, ...args: unknown[]): void {
    (this.io?.emit as ((...a: unknown[]) => void) | undefined)?.(event, ...args);
  }
}
