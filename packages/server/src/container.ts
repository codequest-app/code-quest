import 'reflect-metadata';
import { mysqlSchema, sqliteSchema } from '@code-quest/db-schema';
import type { FilesystemService, GitService, ProcessProvider } from '@code-quest/shared';
import {
  ChildProcessProvider,
  ClaudeAdapter,
  type DiffFileService,
  LocalDiffFileService,
  LocalFilesystemService,
  LocalGitService,
  LocalOpenspecService,
  LocalPluginCliService,
  LocalRootGuard,
  LocalWatchService,
  type OpenspecService,
  type PluginCliService,
  ProcessRunner,
  type WatchService,
} from '@code-quest/summoner';
import { Container } from 'inversify';
import { config } from './config.ts';
import type { MysqlDatabase } from './db/mysql-client.ts';
import { createDatabase, type DrizzleDatabase } from './db/sqlite-client.ts';
import type { Connection } from './remote/connection.ts';
import { RemoteFilesystemService } from './remote/filesystem-service.ts';
import { RemoteGitService } from './remote/git-service.ts';
import { RemoteProcessProvider } from './remote/process-provider.ts';
import { CompositeProjectStore } from './services/composite-project-store.ts';
import { CompositeRawDeltaStore } from './services/composite-raw-delta-store.ts';
import { CompositeRawEventStore } from './services/composite-raw-event-store.ts';
import { CompositeSessionStore } from './services/composite-session-store.ts';
import { CompositeSettingsStore } from './services/composite-settings-store.ts';
import { DirtyBroadcaster } from './services/dirty-broadcaster.ts';
import { DrizzleRawDeltaStore } from './services/drizzle-raw-delta-store.ts';
import { DrizzleRawEventStore } from './services/drizzle-raw-event-store.ts';
import { DrizzleSessionStore } from './services/drizzle-session-store.ts';
import { DrizzleSettingsStore } from './services/drizzle-settings-store.ts';
import { ProjectAutoUpserter } from './services/project-auto-upserter.ts';
import { DrizzleProjectStore, type ProjectStore } from './services/project-store.ts';
import type { RawDeltaStore } from './services/raw-delta-store.ts';
import { RawEventService } from './services/raw-event-service.ts';
import type { RawEventStore } from './services/raw-event-store.ts';
import type { SessionStore } from './services/session-store.ts';
import type { SettingsStore } from './services/settings-store.ts';
import { UsageTracker } from './services/usage-tracker.ts';
import { ChannelEmitter } from './socket/channel-emitter.ts';
import { ChannelManager, type SessionLookup } from './socket/channel-manager.ts';
import { matchesFs, matchesGit, matchesOpenspec } from './socket/dirty-matchers.ts';
import { SessionHistory } from './socket/handlers/session/history.ts';
import { RawRecorder } from './socket/raw-recorder.ts';
import { SocketServer } from './socket/server.ts';
import { type RunnerFactory, TYPES } from './types.ts';

export interface StoreConfig {
  /** SQLite db handle. Undefined = sqlite backend disabled. */
  sqliteDatabase?: DrizzleDatabase;
  /** MySQL db handle. Undefined = mysql backend disabled. */
  mysqlDatabase?: MysqlDatabase;
}

export interface ContainerOptions {
  processProvider?: ProcessProvider;
  storeConfig?: StoreConfig;
  watchService?: WatchService;
  historyBatchSize?: number;
  autoMode?: boolean;
  remoteConnection?: Connection;
  fsRoots?: string[];
  rawEvents?: { writeDeltas?: boolean; readDeltas?: boolean };
}

export function createContainer(options: ContainerOptions): Container {
  const container = new Container();

  if (options.remoteConnection) {
    container
      .bind<ProcessProvider>(TYPES.ProcessProvider)
      .toConstantValue(new RemoteProcessProvider(options.remoteConnection));
  } else if (options.processProvider) {
    container.bind<ProcessProvider>(TYPES.ProcessProvider).toConstantValue(options.processProvider);
  }

  const adapter = new ClaudeAdapter();
  const runnerFactory: RunnerFactory = {
    create: (opts, spawnOptions) =>
      new ProcessRunner({
        adapter,
        processProvider: container.isBound(TYPES.ProcessProvider)
          ? container.get<ProcessProvider>(TYPES.ProcessProvider)
          : undefined,
        args: opts,
        spawnOptions,
      }),
    command: adapter.command,
  };
  container.bind<RunnerFactory>(TYPES.RunnerFactory).toConstantValue(runnerFactory);

  // Bind whichever DB handle is available to TYPES.Database (kept for handler
  // consumers that still reach for a raw Drizzle handle; sqlite preferred when
  // both are present since most tooling keys off it). Fallback to in-memory
  // sqlite only for test containers that pass nothing.
  const db = options.storeConfig?.sqliteDatabase ?? createDatabase(':memory:');
  container.bind<DrizzleDatabase>(TYPES.Database).toConstantValue(db);

  const readDeltas = options.rawEvents?.readDeltas ?? config.rawEvents.readDeltas;
  const writeDeltas = options.rawEvents?.writeDeltas ?? config.rawEvents.writeDeltas;
  const autoMode = options.autoMode ?? config.autoMode;

  const { eventStores, deltaStores, sessionStores, settingsStores } = buildStores(
    options.storeConfig,
    { readDeltas },
  );

  const lowEventStore = pickOrComposite(eventStores, (s) => new CompositeRawEventStore(s));
  const lowDeltaStore = pickOrComposite(deltaStores, (s) => new CompositeRawDeltaStore(s));

  const rawEventService = new RawEventService(lowEventStore, lowDeltaStore);
  container.bind<RawEventService>(TYPES.RawEventService).toConstantValue(rawEventService);

  const sessionStore = pickOrComposite(sessionStores, (s) => new CompositeSessionStore(s));
  container.bind<SessionStore>(TYPES.SessionStore).toConstantValue(sessionStore);

  const projectStores = buildProjectStores(options.storeConfig, db);
  const projectStore = pickOrComposite(projectStores, (s) => new CompositeProjectStore(s));
  container.bind<ProjectStore>(TYPES.ProjectStore).toConstantValue(projectStore);

  const settingsStore = pickOrComposite(settingsStores, (s) => new CompositeSettingsStore(s));
  container.bind<SettingsStore>(TYPES.SettingsStore).toConstantValue(settingsStore);

  const rawRecorder = new RawRecorder(rawEventService, writeDeltas);
  const emitter = new ChannelEmitter();
  // Circular wiring between ChannelManager and SessionHistory via lazy lookup —
  // neither is invoked during construction, so the forward-reference is safe.
  let sessionHistory: SessionHistory;
  const sessionLookup: SessionLookup = {
    resolveSessionId: (channelId) => sessionHistory.resolveSessionId(channelId),
    resolveCwd: async (channelId) => {
      const sessionId = await sessionHistory.resolveSessionId(channelId);
      const row = await sessionStore.getById(sessionId);
      if (!row?.cwd) {
        // L2 territory: legacy rows with null cwd exist until the DB
        // migration runs. This throw surfaces the bad state clearly.
        throw new Error(`Channel ${channelId} has no recorded cwd`);
      }
      return row.cwd;
    },
  };
  const watchService: WatchService = options.watchService ?? new LocalWatchService();
  container.bind<WatchService>(TYPES.WatchService).toConstantValue(watchService);
  const { fsDirtyBroadcaster, gitDirtyBroadcaster, openspecDirtyBroadcaster } =
    bindDirtyBroadcasters(container, watchService);
  const channelManager = new ChannelManager(
    runnerFactory,
    adapter,
    rawRecorder,
    emitter,
    sessionLookup,
    {
      fs: fsDirtyBroadcaster,
      git: gitDirtyBroadcaster,
      openspec: openspecDirtyBroadcaster,
    },
  );
  sessionHistory = new SessionHistory(
    rawEventService,
    sessionStore,
    adapter,
    channelManager,
    options.historyBatchSize,
  );
  container.bind<ChannelManager>(TYPES.ChannelManager).toConstantValue(channelManager);
  container.bind<SessionHistory>(TYPES.SessionHistory).toConstantValue(sessionHistory);
  container.bind<ChannelEmitter>(TYPES.ChannelEventRouter).toConstantValue(emitter);

  // ProjectAutoUpserter — bridges session lifecycle → project entity (Direction C).
  // Constructed after emitter so it can broadcast updates.
  const projectAutoUpserter = new ProjectAutoUpserter(projectStore, emitter);
  container
    .bind<ProjectAutoUpserter>(TYPES.ProjectAutoUpserter)
    .toConstantValue(projectAutoUpserter);

  container.bind<boolean>(TYPES.AutoMode).toConstantValue(autoMode);
  container.bind<UsageTracker>(TYPES.UsageTracker).to(UsageTracker).inSingletonScope();
  container.bind<SocketServer>(TYPES.SocketServer).to(SocketServer).inSingletonScope();
  if (options.remoteConnection) {
    container
      .bind(TYPES.FilesystemService)
      .toConstantValue(new RemoteFilesystemService(options.remoteConnection));
    container
      .bind<GitService>(TYPES.GitService)
      .toConstantValue(new RemoteGitService(options.remoteConnection));
  } else {
    const fsRoots = options.fsRoots ?? [];
    container
      .bind(TYPES.FilesystemService)
      .toConstantValue(
        new LocalFilesystemService(fsRoots, new LocalRootGuard(fsRoots), watchService),
      );
    container.bind<GitService>(TYPES.GitService).toConstantValue(new LocalGitService());
  }
  container
    .bind<PluginCliService>(TYPES.PluginCliService)
    .toConstantValue(new LocalPluginCliService());
  container
    .bind<DiffFileService>(TYPES.DiffFileService)
    .toConstantValue(new LocalDiffFileService());
  const openspecProcess = container.isBound(TYPES.ProcessProvider)
    ? container.get<ProcessProvider>(TYPES.ProcessProvider)
    : new ChildProcessProvider();
  container
    .bind<OpenspecService>(TYPES.OpenspecService)
    .toConstantValue(
      new LocalOpenspecService(
        container.get<FilesystemService>(TYPES.FilesystemService),
        openspecProcess,
      ),
    );

  return container;
}

function pickOrComposite<T>(stores: T[], makeComposite: (stores: T[]) => T): T {
  return stores.length === 1 ? (stores[0] as T) : makeComposite(stores);
}

function bindDirtyBroadcasters(container: Container, watchService: WatchService) {
  const fsDirtyBroadcaster = new DirtyBroadcaster<string[]>(
    watchService,
    matchesFs,
    (paths) => paths,
  );
  const gitDirtyBroadcaster = new DirtyBroadcaster<void>(watchService, matchesGit, () => undefined);
  const openspecDirtyBroadcaster = new DirtyBroadcaster<void>(
    watchService,
    matchesOpenspec,
    () => undefined,
  );
  container
    .bind<DirtyBroadcaster<string[]>>(TYPES.FsDirtyBroadcaster)
    .toConstantValue(fsDirtyBroadcaster);
  container
    .bind<DirtyBroadcaster<void>>(TYPES.GitDirtyBroadcaster)
    .toConstantValue(gitDirtyBroadcaster);
  container
    .bind<DirtyBroadcaster<void>>(TYPES.OpenspecDirtyBroadcaster)
    .toConstantValue(openspecDirtyBroadcaster);
  return { fsDirtyBroadcaster, gitDirtyBroadcaster, openspecDirtyBroadcaster };
}

function buildStores(
  config?: StoreConfig,
  flags: { readDeltas: boolean } = { readDeltas: false },
): {
  eventStores: RawEventStore[];
  deltaStores: RawDeltaStore[];
  sessionStores: SessionStore[];
  settingsStores: SettingsStore[];
} {
  const eventStores: RawEventStore[] = [];
  const deltaStores: RawDeltaStore[] = [];
  const sessionStores: SessionStore[] = [];
  const settingsStores: SettingsStore[] = [];

  if (config?.sqliteDatabase) {
    const db = config.sqliteDatabase;
    const deltaTableForRead = flags.readDeltas ? sqliteSchema.rawDeltas : undefined;
    eventStores.push(new DrizzleRawEventStore(db, sqliteSchema.rawEvents, deltaTableForRead));
    deltaStores.push(new DrizzleRawDeltaStore(db, sqliteSchema.rawDeltas));
    sessionStores.push(new DrizzleSessionStore(db, sqliteSchema.sessions));
    settingsStores.push(new DrizzleSettingsStore(db, sqliteSchema.settings));
  }

  if (config?.mysqlDatabase) {
    const db = config.mysqlDatabase;
    const deltaTableForRead = flags.readDeltas ? mysqlSchema.rawDeltas : undefined;
    eventStores.push(new DrizzleRawEventStore(db, mysqlSchema.rawEvents, deltaTableForRead));
    deltaStores.push(new DrizzleRawDeltaStore(db, mysqlSchema.rawDeltas));
    sessionStores.push(new DrizzleSessionStore(db, mysqlSchema.sessions));
    settingsStores.push(new DrizzleSettingsStore(db, mysqlSchema.settings));
  }

  if (eventStores.length === 0) {
    throw new Error(
      'At least one database backend must be configured. ' +
        'Provide sqliteDatabase and/or mysqlDatabase in StoreConfig.',
    );
  }

  return { eventStores, deltaStores, sessionStores, settingsStores };
}

function buildProjectStores(
  config: StoreConfig | undefined,
  fallbackDb: DrizzleDatabase,
): ProjectStore[] {
  const stores: ProjectStore[] = [];
  if (config?.sqliteDatabase) {
    stores.push(new DrizzleProjectStore(config.sqliteDatabase, sqliteSchema.projects));
  }
  if (config?.mysqlDatabase) {
    stores.push(new DrizzleProjectStore(config.mysqlDatabase, mysqlSchema.projects));
  }
  // Fallback: use the in-memory sqlite handle that container falls back to
  // when no storeConfig is provided (matches the same default for all stores).
  if (stores.length === 0) {
    stores.push(new DrizzleProjectStore(fallbackDb, sqliteSchema.projects));
  }
  return stores;
}
