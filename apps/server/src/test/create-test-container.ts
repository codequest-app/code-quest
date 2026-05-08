import 'reflect-metadata';
import { sqliteMigrationsFolder, sqliteSchema } from '@code-quest/db-schema';
import type {
  DiffFileService,
  FilesystemService,
  GitService,
  OpenspecService,
  PluginCliService,
  ProcessProvider,
} from '@code-quest/summoner';
import {
  FakeDiffFileService,
  FakeFilesystemService,
  FakeGitService,
  FakeOpenspecService,
  FakePluginCliService,
  FakeWatchService,
} from '@code-quest/summoner/test';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { Container } from 'inversify';
import { createContainer } from '../container.ts';
import { createDatabase } from '../db/sqlite-client.ts';
import type { SettingsStore } from '../services/settings-store.ts';
import { TYPES } from '../types.ts';
import { InMemorySettingsStore } from './in-memory-settings-store.ts';

interface TestContainerOverrides {
  processProvider?: ProcessProvider;
  filesystemService?: FilesystemService;
  gitService?: GitService;
  openspecService?: OpenspecService;
  pluginCli?: PluginCliService;
  diffFileService?: DiffFileService;
  historyBatchSize?: number;
  autoMode?: boolean;
  rawEvents?: { writeDeltas?: boolean; readDeltas?: boolean };
}

export function createTestContainer(overrides: TestContainerOverrides = {}): Container {
  const sqliteDatabase = createDatabase(':memory:');
  migrate(sqliteDatabase, { migrationsFolder: sqliteMigrationsFolder });

  const container = createContainer({
    ...overrides,
    watchService: new FakeWatchService(),
    storeConfig: {
      databases: [
        { type: 'sqlite', url: 'file::memory:', db: sqliteDatabase, schema: sqliteSchema },
      ],
    },
    historyBatchSize: overrides.historyBatchSize,
    autoMode: overrides.autoMode ?? true,
    rawEvents: { writeDeltas: false, readDeltas: false, ...overrides.rawEvents },
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

  container
    .rebindSync<OpenspecService>(TYPES.OpenspecService)
    .toConstantValue(overrides.openspecService ?? new FakeOpenspecService());

  container
    .rebindSync<PluginCliService>(TYPES.PluginCliService)
    .toConstantValue(overrides.pluginCli ?? new FakePluginCliService());

  container
    .rebindSync<DiffFileService>(TYPES.DiffFileService)
    .toConstantValue(overrides.diffFileService ?? new FakeDiffFileService());

  return container;
}
