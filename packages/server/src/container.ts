import 'reflect-metadata';
import type { ProcessFactory } from '@code-quest/summoner';
import { Container } from 'inversify';
import { createDatabase, type DrizzleDatabase } from './db/client.ts';
import { type RawEventStore, SqliteRawStore } from './services/raw-event-store.ts';
import { DefaultSessionManager, type SessionManager } from './services/session-manager.ts';
import { ChatHandler } from './socket/chat-handler.ts';
import { TYPES } from './types.ts';

export interface ContainerOptions {
  processFactory?: ProcessFactory;
  database?: DrizzleDatabase;
  dbPath?: string;
}

export function createContainer(options: ContainerOptions = {}): Container {
  const container = new Container();

  if (options.processFactory) {
    container.bind<ProcessFactory>(TYPES.ProcessFactory).toConstantValue(options.processFactory);
  }

  const db = options.database ?? createDatabase(options.dbPath);
  container.bind<DrizzleDatabase>(TYPES.Database).toConstantValue(db);

  container.bind<SessionManager>(TYPES.SessionManager).to(DefaultSessionManager).inSingletonScope();
  container.bind<RawEventStore>(TYPES.RawEventStore).to(SqliteRawStore).inSingletonScope();
  container.bind<ChatHandler>(TYPES.ChatHandler).to(ChatHandler).inSingletonScope();

  return container;
}
