import 'reflect-metadata';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ProcessProvider } from '@code-quest/summoner';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { Container } from 'inversify';
import { createContainer } from '../container.ts';
import type { DrizzleDatabase } from '../db/sqlite-client.ts';
import { InMemorySettingsStore, type SettingsStore } from '../services/settings-store.ts';
import { TYPES } from '../types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle/sqlite');

export interface TestContainerOverrides {
  processProvider?: ProcessProvider;
}

export function createTestContainer(overrides: TestContainerOverrides): Container {
  const container = createContainer({
    ...overrides,
    storeConfig: { sqlite: true },
  });

  const db = container.get<DrizzleDatabase>(TYPES.Database);
  migrate(db, { migrationsFolder });

  // Use in-memory settings in tests to avoid file system state leaking between runs
  container
    .rebindSync<SettingsStore>(TYPES.SettingsStore)
    .toConstantValue(new InMemorySettingsStore());

  return container;
}
