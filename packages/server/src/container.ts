import 'reflect-metadata';
import type { ProcessFactory } from '@code-quest/summoner';
import { Container } from 'inversify';
import type { MysqlDatabase } from './db/mysql-client.ts';
import * as mysqlSchema from './db/schema-mysql.ts';
import * as sqliteSchema from './db/schema-sqlite.ts';
import { createDatabase, type DrizzleDatabase } from './db/sqlite-client.ts';
import { CompositeRawStore } from './services/composite-raw-store.ts';
import { DrizzleRawStore } from './services/drizzle-raw-store.ts';
import { FileRawStore } from './services/file-raw-store.ts';
import type { RawEventStore } from './services/raw-event-store.ts';
import { DefaultSessionManager, type SessionManager } from './services/session-manager.ts';
import { ChatHandler } from './socket/chat-handler.ts';
import { TYPES } from './types.ts';

export interface StoreConfig {
  sqlite?: boolean;
  mysql?: { database: MysqlDatabase };
  file?: { dir: string };
}

export interface ContainerOptions {
  processFactory?: ProcessFactory;
  database?: DrizzleDatabase;
  dbPath?: string;
  storeConfig?: StoreConfig;
}

export function createContainer(options: ContainerOptions = {}): Container {
  const container = new Container();

  if (options.processFactory) {
    container.bind<ProcessFactory>(TYPES.ProcessFactory).toConstantValue(options.processFactory);
  }

  const db = options.database ?? createDatabase(options.dbPath);
  container.bind<DrizzleDatabase>(TYPES.Database).toConstantValue(db);

  container.bind<SessionManager>(TYPES.SessionManager).to(DefaultSessionManager).inSingletonScope();

  const stores: RawEventStore[] = buildStores(db, options.storeConfig);
  const rawEventStore: RawEventStore =
    stores.length === 1 ? stores[0] : new CompositeRawStore(stores);
  container.bind<RawEventStore>(TYPES.RawEventStore).toConstantValue(rawEventStore);

  container.bind<ChatHandler>(TYPES.ChatHandler).to(ChatHandler).inSingletonScope();

  return container;
}

function buildStores(db: DrizzleDatabase, config?: StoreConfig): RawEventStore[] {
  if (!config) {
    return [new DrizzleRawStore(db, sqliteSchema.events)];
  }

  const stores: RawEventStore[] = [];

  if (config.sqlite) {
    stores.push(new DrizzleRawStore(db, sqliteSchema.events));
  }

  if (config.mysql) {
    stores.push(new DrizzleRawStore(config.mysql.database, mysqlSchema.events));
  }

  if (config.file) {
    stores.push(new FileRawStore(config.file.dir));
  }

  if (stores.length === 0) {
    stores.push(new DrizzleRawStore(db, sqliteSchema.events));
  }

  return stores;
}
