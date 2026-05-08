import { sqliteMigrationsFolder } from '@code-quest/db-schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { config } from '../config.ts';
import { createDatabaseFromUrl, parseDatabaseType } from '../db/create-database.ts';

const sqliteUrl = config.database.find((url) => parseDatabaseType(url) === 'sqlite');
if (!sqliteUrl) {
  throw new Error('No SQLite database configured — nothing to migrate.');
}

const entry = createDatabaseFromUrl(sqliteUrl);
if (entry.type !== 'sqlite') throw new Error('Expected SQLite database');
migrate(entry.db, { migrationsFolder: sqliteMigrationsFolder });
console.log('SQLite migration completed');
