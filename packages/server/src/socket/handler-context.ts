import type {
  AuthStatus,
  AvailablePlugin,
  ClientToServerEvents,
  MarketplaceInfo,
  NotificationPayload,
  NotificationResponse,
  PluginInfo,
  ServerToClientEvents,
  SocketEvent,
} from '@code-quest/shared';
import type { ProcessRunner } from '@code-quest/summoner';
import type { Server, Socket } from 'socket.io';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import type { SettingsStore } from '../services/settings-store.ts';
import type { UsageTracker } from '../services/usage-tracker.ts';
import type { RunnerFactory } from '../types.ts';
import type { Channel, WireRunnerHooks } from './channel.ts';
import type { ChannelManager } from './channel-manager.ts';

export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export interface PluginCacheEntry {
  installed: PluginInfo[];
  available: AvailablePlugin[];
  marketplaces: MarketplaceInfo[];
  ts: number;
}

/**
 * Shared context that all handler modules receive.
 * SocketServer implements this interface.
 */
export interface HandlerContext {
  // ── Factories ──
  readonly runnerFactory: RunnerFactory;

  // ── Stores ──
  readonly channelManager: ChannelManager;
  readonly sessionStore: SessionStore;
  readonly rawEventStore: RawEventStore;
  readonly settingsStore: SettingsStore;
  readonly usageTracker: UsageTracker;

  // ── Server reference ──
  readonly io?: TypedServer | undefined;

  // ── Shared state ──
  authState: AuthStatus;
  cachedModels: unknown[] | undefined;
  chromeMcpState: { status: 'disconnected' | 'connecting' | 'connected' };
  pluginCache: Map<string, PluginCacheEntry>;
  readonly PLUGIN_CACHE_TTL: number;
  socketChannelsMap: Map<string, Set<string>>;

  // ── Methods ──
  requireRunner(socket: TypedSocket, channelId: string): ProcessRunner | null;

  broadcastSessionState(
    channelId: string,
    state: 'launching' | 'busy' | 'idle' | 'exited' | 'disconnected',
    title?: string,
  ): void;

  emitToSession(channelId: string, ...args: Parameters<TypedSocket['emit']>): void;

  addSocketToChannel(channel: Channel, socket: TypedSocket): void;

  getSessionHistory(channelId: string): Promise<SocketEvent[]>;

  getPendingReplayEvents(
    sessionId: string,
  ): Promise<{ events: SocketEvent[]; respondedRequestIds: Set<string> }>;

  buildChannelHooks(channelId: string): WireRunnerHooks;

  resolveSessionId(channelId: string): Promise<string>;

  sendNotification(channelId: string, payload: NotificationPayload): Promise<NotificationResponse>;
}

// ── Free functions shared across handlers ──

export function errMsg(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/**
 * Look up channel by ID. If not found, invoke callback with error and return null.
 * Eliminates the repeated `const ch = ctx.channelManager.get(id); if (!ch) { cb({error}); return; }` pattern.
 */
export function ensureChannel(
  ctx: HandlerContext,
  channelId: string,
  callback?: (res: { error: string }) => void,
): Channel | null {
  const channel = ctx.channelManager.get(channelId);
  if (!channel) {
    callback?.({ error: 'Session not found' });
    return null;
  }
  return channel;
}
