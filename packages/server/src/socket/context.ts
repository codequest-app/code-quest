import type { AuthStatus } from '@code-quest/shared';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import type { SettingsStore } from '../services/settings-store.ts';
import type { UsageTracker } from '../services/usage-tracker.ts';
import type { WireRunnerHooks } from './channel.ts';
import type { ChannelManager } from './channel-manager.ts';
import type { SessionHistory } from './session-history.ts';
import type { TypedServer } from './types.ts';

/**
 * Shared context that all handler modules receive.
 * SocketServer implements this interface.
 */
export interface HandlerContext {
  // ── Stores ──
  readonly channelManager: ChannelManager;
  readonly sessionStore: SessionStore;
  readonly rawEventStore: RawEventStore;
  readonly sessionHistory: SessionHistory;
  readonly settingsStore: SettingsStore;
  readonly usageTracker: UsageTracker;

  // ── Server reference ──
  readonly io?: TypedServer | undefined;

  // ── Shared state ──
  authState: AuthStatus;
  cachedModels: unknown[] | undefined;

  // ── Methods ──
  buildChannelHooks(channelId: string): WireRunnerHooks;
}
