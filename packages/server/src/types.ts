import type {
  FilesystemService,
  GitService,
  LaunchOptions,
  ProcessRunner,
} from '@code-quest/summoner';
import type { RawEventService } from './services/raw-event-service.ts';
import type { SessionStore } from './services/session-store.ts';
import type { SettingsStore } from './services/settings-store.ts';
import type { UsageTracker } from './services/usage-tracker.ts';
import type { ChannelEmitter } from './socket/channel-emitter.ts';
import type { ChannelManager } from './socket/channel-manager.ts';
import type { PlanApi } from './socket/handlers/plan.ts';
import type { SessionHistory } from './socket/session-history.ts';

export interface RunnerFactory {
  create(opts?: LaunchOptions, spawnOptions?: Record<string, unknown>): ProcessRunner;
  readonly command: string;
}

export const TYPES = {
  RunnerFactory: Symbol.for('RunnerFactory'),
  SessionStore: Symbol.for('SessionStore'),
  RawEventService: Symbol.for('RawEventService'),
  SocketServer: Symbol.for('SocketServer'),
  Database: Symbol.for('Database'),
  UsageTracker: Symbol.for('UsageTracker'),
  SettingsStore: Symbol.for('SettingsStore'),
  ChannelManager: Symbol.for('ChannelManager'),
  SessionHistory: Symbol.for('SessionHistory'),
  ChannelEventRouter: Symbol.for('ChannelEventRouter'),
  FilesystemService: Symbol.for('FilesystemService'),
  GitService: Symbol.for('GitService'),
  ProcessProvider: Symbol.for('ProcessProvider'),
} as const;

export interface HandlerContext {
  emitter: ChannelEmitter;
  channelManager: ChannelManager;
  sessionStore: SessionStore;
  settingsStore: SettingsStore;
  usageTracker: UsageTracker;
  sessionHistory: SessionHistory;
  rawEventService: RawEventService;
  filesystemService: FilesystemService;
  gitService: GitService;
  planHandler: PlanApi;
}
