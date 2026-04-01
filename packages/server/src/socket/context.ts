import type {
  AuthStatus,
  NotificationPayload,
  NotificationResponse,
  SocketEvent,
} from '@code-quest/shared';
import type { ProcessRunner } from '@code-quest/summoner';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import type { SettingsStore } from '../services/settings-store.ts';
import type { UsageTracker } from '../services/usage-tracker.ts';
import type { RunnerFactory } from '../types.ts';
import type { Channel, WireRunnerHooks } from './channel.ts';
import type { ChannelManager } from './channel-manager.ts';
import type { TypedServer, TypedSocket } from './types.ts';

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
