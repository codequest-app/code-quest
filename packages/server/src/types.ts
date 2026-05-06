import type {
  DiffFileService,
  FilesystemService,
  GitService,
  LaunchOptions,
  OpenspecService,
  PluginCliService,
  ProcessRunner,
} from '@code-quest/summoner';
import type { DirtyBroadcaster } from './services/dirty-broadcaster.ts';
import type { ProjectAutoUpserter } from './services/project-auto-upserter.ts';
import type { ProjectStore } from './services/project-store.ts';
import type { RawEventService } from './services/raw-event-service.ts';
import type { SessionStore } from './services/session-store.ts';
import type { SettingsStore } from './services/settings-store.ts';
import type { UsageTracker } from './services/usage-tracker.ts';
import type { ChannelEmitter } from './socket/channel-emitter.ts';
import type { ChannelManager } from './socket/channel-manager.ts';
import type { PlanApi } from './socket/handlers/plan.ts';
import type { SessionHistory } from './socket/handlers/session/history.ts';

export interface RunnerFactory {
  create(opts?: LaunchOptions, spawnOptions?: Record<string, unknown>): ProcessRunner;
  readonly command: string;
}

export const TYPES: {
  readonly RunnerFactory: symbol;
  readonly SessionStore: symbol;
  readonly ProjectStore: symbol;
  readonly ProjectAutoUpserter: symbol;
  readonly RawEventService: symbol;
  readonly SocketServer: symbol;
  readonly Database: symbol;
  readonly UsageTracker: symbol;
  readonly SettingsStore: symbol;
  readonly ChannelManager: symbol;
  readonly SessionHistory: symbol;
  readonly ChannelEventRouter: symbol;
  readonly FilesystemService: symbol;
  readonly GitService: symbol;
  readonly OpenspecService: symbol;
  readonly PluginCliService: symbol;
  readonly DiffFileService: symbol;
  readonly ProcessProvider: symbol;
  readonly WatchService: symbol;
  readonly FsDirtyBroadcaster: symbol;
  readonly GitDirtyBroadcaster: symbol;
  readonly OpenspecDirtyBroadcaster: symbol;
} = {
  RunnerFactory: Symbol.for('RunnerFactory'),
  SessionStore: Symbol.for('SessionStore'),
  ProjectStore: Symbol.for('ProjectStore'),
  ProjectAutoUpserter: Symbol.for('ProjectAutoUpserter'),
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
  OpenspecService: Symbol.for('OpenspecService'),
  PluginCliService: Symbol.for('PluginCliService'),
  DiffFileService: Symbol.for('DiffFileService'),
  ProcessProvider: Symbol.for('ProcessProvider'),
  WatchService: Symbol.for('WatchService'),
  FsDirtyBroadcaster: Symbol.for('FsDirtyBroadcaster'),
  GitDirtyBroadcaster: Symbol.for('GitDirtyBroadcaster'),
  OpenspecDirtyBroadcaster: Symbol.for('OpenspecDirtyBroadcaster'),
} as const;

export interface HandlerContext {
  emitter: ChannelEmitter;
  channelManager: ChannelManager;
  sessionStore: SessionStore;
  projectStore: ProjectStore;
  projectAutoUpserter: ProjectAutoUpserter;
  settingsStore: SettingsStore;
  usageTracker: UsageTracker;
  sessionHistory: SessionHistory;
  rawEventService: RawEventService;
  filesystemService: FilesystemService;
  gitService: GitService;
  openspecService: OpenspecService;
  pluginCli: PluginCliService;
  diffFileService: DiffFileService;
  planHandler: PlanApi;
  fsDirtyBroadcaster: DirtyBroadcaster<string[]>;
  gitDirtyBroadcaster: DirtyBroadcaster<void>;
  openspecDirtyBroadcaster: DirtyBroadcaster<void>;
}
