import 'reflect-metadata';
import type { ProcessFactory } from '@code-quest/summoner';
import { Container } from 'inversify';
import type { MysqlDatabase } from './db/mysql-client.ts';
import * as mysqlSchema from './db/schema-mysql.ts';
import * as sqliteSchema from './db/schema-sqlite.ts';
import { createDatabase, type DrizzleDatabase } from './db/sqlite-client.ts';
import { CompositeRawStore } from './services/composite-raw-store.ts';
import { CompositeSessionStore } from './services/composite-session-store.ts';
import { DrizzleRawStore } from './services/drizzle-raw-store.ts';
import { DrizzleSessionStore } from './services/drizzle-session-store.ts';
import { FileRawStore } from './services/file-raw-store.ts';
import type { RawEventStore } from './services/raw-event-store.ts';
import { DefaultSessionManager, type SessionManager } from './services/session-manager.ts';
import type { SessionStore } from './services/session-store.ts';
import { ChatHandler } from './socket/chat-handler.ts';
import { TYPES } from './types.ts';

export interface StoreConfig {
  sqlite?: boolean;
  mysql?: { database: MysqlDatabase };
  file?: { dir: string };
}

export interface ContainerOptions {
  processFactory: ProcessFactory;
  database?: DrizzleDatabase;
  dbPath?: string;
  storeConfig?: StoreConfig;
}

export function createContainer(options: ContainerOptions): Container {
  const container = new Container();

  container.bind<ProcessFactory>(TYPES.ProcessFactory).toConstantValue(options.processFactory);

  const db = options.database ?? createDatabase(options.dbPath);
  container.bind<DrizzleDatabase>(TYPES.Database).toConstantValue(db);

  const { eventStores, sessionStores } = buildStores(db, options.storeConfig);

  const rawEventStore: RawEventStore =
    eventStores.length === 1 ? eventStores[0] : new CompositeRawStore(eventStores);
  container.bind<RawEventStore>(TYPES.RawEventStore).toConstantValue(rawEventStore);

  const sessionStore: SessionStore =
    sessionStores.length === 1 ? sessionStores[0] : new CompositeSessionStore(sessionStores);
  container.bind<SessionStore>(TYPES.SessionStore).toConstantValue(sessionStore);

  container.bind<SessionManager>(TYPES.SessionManager).to(DefaultSessionManager).inSingletonScope();
  container.bind<ChatHandler>(TYPES.ChatHandler).to(ChatHandler).inSingletonScope();

  return container;
}

function buildStores(
  db: DrizzleDatabase,
  config?: StoreConfig,
): { eventStores: RawEventStore[]; sessionStores: SessionStore[] } {
  const eventStores: RawEventStore[] = [];
  const sessionStores: SessionStore[] = [];

  if (config?.sqlite) {
    eventStores.push(new DrizzleRawStore(db, sqliteSchema.rawEntries));
    sessionStores.push(new DrizzleSessionStore(db, sqliteSchema.sessions));
  }

  if (config?.mysql) {
    eventStores.push(new DrizzleRawStore(config.mysql.database, mysqlSchema.rawEntries));
    sessionStores.push(new DrizzleSessionStore(config.mysql.database, mysqlSchema.sessions));
  }

  if (config?.file) {
    eventStores.push(new FileRawStore(config.file.dir));
  }

  if (eventStores.length === 0) {
    eventStores.push(new DrizzleRawStore(db, sqliteSchema.rawEntries));
  }
  if (sessionStores.length === 0) {
    sessionStores.push(new DrizzleSessionStore(db, sqliteSchema.sessions));
  }

  return { eventStores, sessionStores };
}
