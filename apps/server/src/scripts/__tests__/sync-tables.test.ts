import { sqliteMigrationsFolder, sqliteSchema } from '@code-quest/db-schema';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { describe, expect, it } from 'vitest';
import { syncTables } from '../sync-tables.ts';

function createMigratedDb() {
  const raw = new Database(':memory:');
  const db = drizzle(raw);
  migrate(db, { migrationsFolder: sqliteMigrationsFolder });
  return db;
}

describe('syncTables', () => {
  it('syncs rows from source to target', async () => {
    const source = createMigratedDb();
    const target = createMigratedDb();

    source
      .insert(sqliteSchema.settings)
      .values([
        { provider: 'claude', key: 'theme', value: 'dark' },
        { provider: 'claude', key: 'lang', value: 'en' },
      ])
      .run();

    const result = await syncTables(source, target, [
      { name: 'settings', from: sqliteSchema.settings, to: sqliteSchema.settings },
    ]);

    const rows = target.select().from(sqliteSchema.settings).all();
    expect(rows).toHaveLength(2);
    expect(result).toEqual([{ name: 'settings', count: 2 }]);
  });

  it('clears existing target rows before sync', async () => {
    const source = createMigratedDb();
    const target = createMigratedDb();

    target
      .insert(sqliteSchema.settings)
      .values({ provider: 'old', key: 'old', value: 'old' })
      .run();
    source
      .insert(sqliteSchema.settings)
      .values({ provider: 'new', key: 'new', value: 'new' })
      .run();

    await syncTables(source, target, [
      { name: 'settings', from: sqliteSchema.settings, to: sqliteSchema.settings },
    ]);

    const rows = target.select().from(sqliteSchema.settings).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.provider).toBe('new');
  });

  it('skips empty tables', async () => {
    const source = createMigratedDb();
    const target = createMigratedDb();

    const result = await syncTables(source, target, [
      { name: 'settings', from: sqliteSchema.settings, to: sqliteSchema.settings },
    ]);

    expect(result).toEqual([{ name: 'settings', count: 0 }]);
    const rows = target.select().from(sqliteSchema.settings).all();
    expect(rows).toHaveLength(0);
  });

  it('runs in a transaction — target unchanged on source read failure', async () => {
    const source = createMigratedDb();
    const target = createMigratedDb();

    target
      .insert(sqliteSchema.settings)
      .values({ provider: 'keep', key: 'keep', value: 'keep' })
      .run();

    const badTable = {
      ...sqliteSchema.settings,
      _: { ...sqliteSchema.settings._ },
    } as typeof sqliteSchema.settings;
    Object.defineProperty(badTable, Symbol.for('drizzle:Name'), { value: 'nonexistent_table' });

    await expect(
      syncTables(source, target, [{ name: 'settings', from: badTable, to: sqliteSchema.settings }]),
    ).rejects.toThrow();

    const rows = target.select().from(sqliteSchema.settings).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.provider).toBe('keep');
  });
});
