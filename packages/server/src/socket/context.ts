import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import type { SettingsStore } from '../services/settings-store.ts';
import type { UsageTracker } from '../services/usage-tracker.ts';
import type { ChannelManager } from './channel-manager.ts';
import type { SessionHistory } from './session-history.ts';

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
}
