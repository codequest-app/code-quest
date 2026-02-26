import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema-sqlite.ts';

export type DrizzleDatabase = ReturnType<typeof createDrizzle>;

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultMigrationsFolder = resolve(__dirname, '../../drizzle/sqlite');

function createDrizzle(sqlite: Database.Database) {
  return drizzle(sqlite, { schema });
}

export function createDatabase(
  path = ':memory:',
  migrationsFolder = defaultMigrationsFolder,
): DrizzleDatabase {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
  const sqlite = new Database(path);
  sqlite.pragma('journal_mode = WAL');
  const db = createDrizzle(sqlite);

  migrate(db, { migrationsFolder });

  return db;
}
