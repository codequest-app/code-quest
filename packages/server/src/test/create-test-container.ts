import 'reflect-metadata';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FilesystemService, GitService, ProcessProvider } from '@code-quest/summoner';
import { FakeFilesystemService, FakeGitService } from '@code-quest/summoner/test';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { Container } from 'inversify';
import { createContainer } from '../container.ts';
import { createDatabase } from '../db/sqlite-client.ts';
import type { SettingsStore } from '../services/settings-store.ts';
import { TYPES } from '../types.ts';
import { InMemorySettingsStore } from './in-memory-settings-store.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle/sqlite');

interface TestContainerOverrides {
  processProvider?: ProcessProvider;
  filesystemService?: FilesystemService;
  gitService?: GitService;
}

export function createTestContainer(overrides: TestContainerOverrides = {}): Container {
  const sqliteDatabase = createDatabase(':memory:');
  migrate(sqliteDatabase, { migrationsFolder });

  const container = createContainer({
    ...overrides,
    storeConfig: { sqliteDatabase },
  });

  // Use in-memory settings in tests to avoid file system state leaking between runs
  container
    .rebindSync<SettingsStore>(TYPES.SettingsStore)
    .toConstantValue(new InMemorySettingsStore());

  container
    .rebindSync<FilesystemService>(TYPES.FilesystemService)
    .toConstantValue(overrides.filesystemService ?? new FakeFilesystemService());

  container
    .rebindSync<GitService>(TYPES.GitService)
    .toConstantValue(overrides.gitService ?? new FakeGitService());

  return container;
}
