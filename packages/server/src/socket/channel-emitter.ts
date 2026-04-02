import type { Channel } from './channel.ts';
import type { SocketCallback, TypedServer, TypedSocket } from './types.ts';

/** Unified handler signature for all events (runner + client). */
export type EmitterHandler = (
  ch: Channel | null,
  payload: unknown,
  socket?: TypedSocket,
  cb?: SocketCallback,
) => void;

/** Middleware: skip if no channel. */
export function withChannel(
  handler: (ch: Channel, payload: unknown, socket?: TypedSocket, cb?: SocketCallback) => void,
): EmitterHandler {
  return (ch, payload, socket, cb) => {
    if (!ch) return;
    handler(ch, payload, socket, cb);
  };
}

/** Middleware: require both channel and socket. */
export function withSocket(
  handler: (ch: Channel, socket: TypedSocket, payload: unknown, cb?: SocketCallback) => void,
): EmitterHandler {
  return (ch, payload, socket, cb) => {
    if (!ch || !socket) return;
    handler(ch, socket, payload, cb);
  };
}

export class ChannelEmitter {
  private eventMap = new Map<string, EmitterHandler[]>();

  // ── Socket tracking ──
  private channelSockets = new Map<string, Set<TypedSocket>>();
  private socketChannels = new Map<string, Set<string>>();
  private io?: TypedServer;

  // ── Subscribe ──

  on(name: string, handler: EmitterHandler): void {
    const handlers = this.eventMap.get(name) ?? [];
    handlers.push(handler);
    this.eventMap.set(name, handlers);
  }

  // ── Dispatch ──

  dispatch(
    event: string,
    ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    cb?: SocketCallback,
  ): unknown {
    const handlers = this.eventMap.get(event);
    if (!handlers) return;
    let result: unknown;
    for (const h of handlers) result = h(ch, payload, socket, cb);
    return result;
  }

  /**
   * Dispatch a runner socket_event.
   * Auto-broadcasts to channel sockets (except session:init).
   */
  dispatchRunnerEvent(channelId: string, ch: Channel, event: string, payload: unknown): void {
    if (event !== 'session:init') {
      this.emit(channelId, event, { channelId, ...((payload as Record<string, unknown>) ?? {}) });
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

  emitToOthers(channelId: string, excludeSocketId: string, event: string, ...args: unknown[]): void {
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

    for (const channelId of channelIds) {
      const sockets = this.channelSockets.get(channelId);
      if (!sockets) continue;
      for (const sock of sockets) {
        if (sock.id === socketId) {
          sockets.delete(sock);
          break;
        }
      }
    }

    this.socketChannels.delete(socketId);
    return channelIds;
  }

  getSocketCount(channelId: string): number {
    return this.channelSockets.get(channelId)?.size ?? 0;
  }

  // ── Connection handling ──

  private _resolveChannel?: (channelId: string) => Channel | undefined;

  handleConnection(
    socket: TypedSocket,
    resolveChannel: (channelId: string) => Channel | undefined,
  ): void {
    this._resolveChannel = resolveChannel;

    // Wire client socket events for emitter.on subscribers only
    for (const event of this.eventMap.keys()) {
      // biome-ignore lint/suspicious/noExplicitAny: socket.io typed emit signatures vary per event
      socket.on(event as any, (...args: any[]) => {
        const payload = args[0] ?? {};
        const cb = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : undefined;
        const channelId = typeof payload?.channelId === 'string' ? payload.channelId : undefined;
        const ch = channelId ? (resolveChannel(channelId) ?? null) : null;
        return this.dispatch(event, ch, payload, socket, cb !== payload ? cb : undefined);
      });
    }

    socket.on('disconnect', () => {
      this.removeSocketFromAll(socket.id);
    });
  }

  /** Resolve channelId → Channel (set by handleConnection). */
  resolveChannel(channelId: string): Channel | undefined {
    return this._resolveChannel?.(channelId);
  }

  // ── Global broadcast (via io) ──

  register(io: TypedServer): void {
    this.io = io;
  }

  broadcastAll(event: string, ...args: unknown[]): void {
    (this.io?.emit as ((...a: unknown[]) => void) | undefined)?.(event, ...args);
  }
}
