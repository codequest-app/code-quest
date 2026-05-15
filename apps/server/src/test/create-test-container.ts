import 'reflect-metadata';
import { sqliteMigrationsFolder, sqliteSchema } from '@code-quest/db-schema';
import type {
  DiffFileService,
  FilesystemService,
  GitService,
  OpenspecService,
  PluginCliService,
  ProcessProvider,
  WatchService,
} from '@code-quest/summoner';
import {
  FakeDiffFileService,
  FakeOpenspecService,
  FakePluginCliService,
} from '@code-quest/summoner/test';
import { FakeFilesystemService, FakeGitService, FakeWatchService } from '@code-quest/test-kit';
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
  watchService?: WatchService;
  historyBatchSize?: number;
  autoMode?: boolean;
  rawEvents?: { writeDeltas?: boolean; readDeltas?: boolean };
}

export function createTestContainer(overrides: TestContainerOverrides = {}): Container {
  const sqliteDatabase = createDatabase(':memory:');
  migrate(sqliteDatabase, { migrationsFolder: sqliteMigrationsFolder });

  const container = createContainer({
    ...overrides,
    watchService: overrides.watchService ?? new FakeWatchService(),
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
  container.rebind<SettingsStore>(TYPES.SettingsStore).toConstantValue(new InMemorySettingsStore());

  container
    .rebind<FilesystemService>(TYPES.FilesystemService)
    .toConstantValue(overrides.filesystemService ?? new FakeFilesystemService());

  container
    .rebind<GitService>(TYPES.GitService)
    .toConstantValue(overrides.gitService ?? new FakeGitService());

  container
    .rebind<OpenspecService>(TYPES.OpenspecService)
    .toConstantValue(overrides.openspecService ?? new FakeOpenspecService());

  container
    .rebind<PluginCliService>(TYPES.PluginCliService)
    .toConstantValue(overrides.pluginCli ?? new FakePluginCliService());

  container
    .rebind<DiffFileService>(TYPES.DiffFileService)
    .toConstantValue(overrides.diffFileService ?? new FakeDiffFileService());

  return container;
}
