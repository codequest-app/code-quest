import type { SocketEvent } from '@code-quest/shared';
import type { ServerAction } from '@code-quest/summoner';
import type { Channel } from './channel.ts';
import type { TypedServer, TypedSocket } from './types.ts';

type ChannelEventFn = (channelId: string, ch: Channel, se: SocketEvent) => void;
type ChannelActionFn = (channelId: string, ch: Channel, action: ServerAction) => boolean;
type ChannelExitFn = (channelId: string, ch: Channel, code: number | null) => void;

export class ChannelEmitter {
  // ── Event subscriptions (from ChannelEventRouter) ──
  private eventMap = new Map<string, ChannelEventFn[]>();
  private actionHandlers: ChannelActionFn[] = [];
  private exitHandlers: ChannelExitFn[] = [];

  // ── Socket tracking ──
  private channelSockets = new Map<string, Set<TypedSocket>>();
  private socketChannels = new Map<string, Set<string>>();
  private io?: TypedServer;

  // ── Subscribe (on) ──

  on(name: string, handler: ChannelEventFn): void {
    const handlers = this.eventMap.get(name) ?? [];
    handlers.push(handler);
    this.eventMap.set(name, handlers);
  }

  onAction(handler: ChannelActionFn): void {
    this.actionHandlers.push(handler);
  }

  onExit(handler: ChannelExitFn): void {
    this.exitHandlers.push(handler);
  }

  // ── Dispatch (from runner/client → to subscribers) ──

  dispatchEvent(channelId: string, ch: Channel, se: SocketEvent): void {
    // Auto-broadcast to channel sockets (except session:init — handled by connect handler)
    if (se.name !== 'session:init') {
      this.emit(channelId, se.name, { channelId, ...se.payload });
    }

    // Dispatch to subscribers
    const handlers = this.eventMap.get(se.name);
    if (handlers) {
      for (const h of handlers) h(channelId, ch, se);
    }
  }

  dispatchAction(channelId: string, ch: Channel, action: ServerAction): void {
    for (const h of this.actionHandlers) {
      if (h(channelId, ch, action)) break;
    }
  }

  dispatchExit(channelId: string, ch: Channel, code: number | null): void {
    for (const h of this.exitHandlers) {
      h(channelId, ch, code);
    }
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

  // ── Global broadcast (via io) ──

  register(io: TypedServer): void {
    this.io = io;
  }

  broadcastAll(event: string, ...args: unknown[]): void {
    (this.io?.emit as ((...a: unknown[]) => void) | undefined)?.(event, ...args);
  }
}
