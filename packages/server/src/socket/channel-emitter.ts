import type { Channel } from './channel.ts';
import type { SocketCallback, TypedServer, TypedSocket } from './types.ts';

/** Unified handler signature for all events (runner + client). */
export type EmitterHandler = (
  ch: Channel | null,
  payload: unknown,
  socket?: TypedSocket,
  cb?: SocketCallback,
) => void;

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
  ): void {
    const handlers = this.eventMap.get(event);
    if (handlers) {
      for (const h of handlers) h(ch, payload, socket, cb);
    }
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
