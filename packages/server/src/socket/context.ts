import type { AuthStatus } from '@code-quest/shared';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import type { SettingsStore } from '../services/settings-store.ts';
import type { UsageTracker } from '../services/usage-tracker.ts';
import type { RunnerFactory } from '../types.ts';
import type { Channel, WireRunnerHooks } from './channel.ts';
import type { ChannelManager } from './channel-manager.ts';
import type { SessionBroadcastState, TypedServer, TypedSocket } from './types.ts';

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
  socketChannelsMap: Map<string, Set<string>>;

  // ── Methods ──
  broadcastSessionState(channelId: string, state: SessionBroadcastState, title?: string): void;

  emitToSession(channelId: string, ...args: Parameters<TypedSocket['emit']>): void;

  addSocketToChannel(channel: Channel, socket: TypedSocket): void;

  buildChannelHooks(channelId: string): WireRunnerHooks;
}
