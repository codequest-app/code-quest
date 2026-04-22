import 'reflect-metadata';
import type { ProcessProvider } from '@code-quest/summoner';
import {
  ClaudeAdapter,
  type GitService,
  LocalFilesystemService,
  LocalGitService,
  ProcessRunner,
} from '@code-quest/summoner';
import { Container } from 'inversify';
import { config } from './config.ts';
import type { MysqlDatabase } from './db/mysql-client.ts';
import * as mysqlSchema from './db/schema-mysql.ts';
import * as sqliteSchema from './db/schema-sqlite.ts';
import { createDatabase, type DrizzleDatabase } from './db/sqlite-client.ts';
import { CompositeRawEventStore } from './services/composite-raw-event-store.ts';
import { CompositeSessionStore } from './services/composite-session-store.ts';
import { DrizzleRawEventStore } from './services/drizzle-raw-event-store.ts';
import { DrizzleSessionStore } from './services/drizzle-session-store.ts';
import { DrizzleSettingsStore } from './services/drizzle-settings-store.ts';
import type { RawEventStore } from './services/raw-event-store.ts';
import type { SessionStore } from './services/session-store.ts';
import type { SettingsStore } from './services/settings-store.ts';
import { UsageTracker } from './services/usage-tracker.ts';
import { ChannelEmitter } from './socket/channel-emitter.ts';
import { ChannelManager } from './socket/channel-manager.ts';
import { RawRecorder } from './socket/raw-recorder.ts';
import { SocketServer } from './socket/server.ts';
import { SessionHistory } from './socket/session-history.ts';
import { type RunnerFactory, TYPES } from './types.ts';

export interface StoreConfig {
  sqlite?: boolean;
  mysql?: { database: MysqlDatabase };
}

export interface ContainerOptions {
  processProvider?: ProcessProvider;
  database?: DrizzleDatabase;
  dbPath?: string;
  storeConfig?: StoreConfig;
}

export function createContainer(options: ContainerOptions): Container {
  const container = new Container();

  if (options.processProvider) {
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
    args: adapter.buildArgs(),
  };
  container.bind<RunnerFactory>(TYPES.RunnerFactory).toConstantValue(runnerFactory);

  const db = options.database ?? createDatabase(options.dbPath);
  container.bind<DrizzleDatabase>(TYPES.Database).toConstantValue(db);

  const { eventStores, sessionStores, settingsStores } = buildStores(db, options.storeConfig);

  const rawEventStore: RawEventStore =
    eventStores.length === 1 ? eventStores[0] : new CompositeRawEventStore(eventStores);
  container.bind<RawEventStore>(TYPES.RawEventStore).toConstantValue(rawEventStore);

  const sessionStore: SessionStore =
    sessionStores.length === 1 ? sessionStores[0] : new CompositeSessionStore(sessionStores);
  container.bind<SessionStore>(TYPES.SessionStore).toConstantValue(sessionStore);

  const rawRecorder = new RawRecorder(rawEventStore);
  const emitter = new ChannelEmitter();
  // SessionHistory and ChannelManager reference each other via lazy callbacks
  // (neither is called during construction — only at runtime)
  const sessionHistory: SessionHistory = new SessionHistory(
    rawEventStore,
    sessionStore,
    adapter,
    (id) => channelManager.get(id),
  );
  const channelManager: ChannelManager = new ChannelManager(
    runnerFactory,
    adapter,
    rawRecorder,
    emitter,
    (channelId) => sessionHistory.resolveSessionId(channelId),
    async (channelId) => {
      const sessionId = await sessionHistory.resolveSessionId(channelId);
      const row = await sessionStore.getById(sessionId);
      if (!row?.cwd) {
        // L2 territory: legacy rows with null cwd exist until the DB
        // migration runs. This throw surfaces the bad state clearly.
        throw new Error(`Channel ${channelId} has no recorded cwd`);
      }
      return row.cwd;
    },
  );
  container.bind<ChannelManager>(TYPES.ChannelManager).toConstantValue(channelManager);
  container.bind<SessionHistory>(TYPES.SessionHistory).toConstantValue(sessionHistory);
  container.bind<ChannelEmitter>(TYPES.ChannelEventRouter).toConstantValue(emitter);

  container.bind<UsageTracker>(TYPES.UsageTracker).to(UsageTracker).inSingletonScope();
  container.bind<SocketServer>(TYPES.SocketServer).to(SocketServer).inSingletonScope();
  container
    .bind(TYPES.FilesystemService)
    .toConstantValue(new LocalFilesystemService(config.explorerRoots));
  container.bind<GitService>(TYPES.GitService).toConstantValue(new LocalGitService());

  const settingsStore: SettingsStore = settingsStores[0];
  container.bind<SettingsStore>(TYPES.SettingsStore).toConstantValue(settingsStore);

  return container;
}

function buildStores(
  db: DrizzleDatabase,
  config?: StoreConfig,
): {
  eventStores: RawEventStore[];
  sessionStores: SessionStore[];
  settingsStores: SettingsStore[];
} {
  const eventStores: RawEventStore[] = [];
  const sessionStores: SessionStore[] = [];
  const settingsStores: SettingsStore[] = [];

  if (config?.sqlite) {
    eventStores.push(new DrizzleRawEventStore(db, sqliteSchema.rawEvents));
    sessionStores.push(new DrizzleSessionStore(db, sqliteSchema.sessions));
    settingsStores.push(new DrizzleSettingsStore(db, sqliteSchema.settings));
  }

  if (config?.mysql) {
    eventStores.push(new DrizzleRawEventStore(config.mysql.database, mysqlSchema.rawEvents));
    sessionStores.push(new DrizzleSessionStore(config.mysql.database, mysqlSchema.sessions));
    settingsStores.push(new DrizzleSettingsStore(config.mysql.database, mysqlSchema.settings));
  }

  if (eventStores.length === 0) {
    eventStores.push(new DrizzleRawEventStore(db, sqliteSchema.rawEvents));
  }
  if (sessionStores.length === 0) {
    sessionStores.push(new DrizzleSessionStore(db, sqliteSchema.sessions));
  }
  if (settingsStores.length === 0) {
    settingsStores.push(new DrizzleSettingsStore(db, sqliteSchema.settings));
  }

  return { eventStores, sessionStores, settingsStores };
}
