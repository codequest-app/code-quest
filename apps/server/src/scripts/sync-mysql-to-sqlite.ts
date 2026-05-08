import { mysqlSchema, sqliteMigrationsFolder, sqliteSchema } from '@code-quest/db-schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { config } from '../config.ts';
import { createDatabaseFromUrl, parseDatabaseType } from '../db/create-database.ts';
import { syncTables } from './sync-tables.ts';

const mysqlUrl = config.database.find((url) => parseDatabaseType(url) === 'mysql');
const sqliteUrl = config.database.find((url) => parseDatabaseType(url) === 'sqlite');

if (!mysqlUrl) throw new Error('No MySQL database configured.');
if (!sqliteUrl) throw new Error('No SQLite database configured.');

const mysql = createDatabaseFromUrl(mysqlUrl);
if (mysql.type !== 'mysql') throw new Error('Expected MySQL');
const sqlite = createDatabaseFromUrl(sqliteUrl);
if (sqlite.type !== 'sqlite') throw new Error('Expected SQLite');

migrate(sqlite.db, { migrationsFolder: sqliteMigrationsFolder });
console.log('SQLite schema migrated');

const results = await syncTables(mysql.db as never, sqlite.db as never, [
  { name: 'sessions', from: mysqlSchema.sessions, to: sqliteSchema.sessions },
  { name: 'raw_events', from: mysqlSchema.rawEvents, to: sqliteSchema.rawEvents },
  { name: 'raw_deltas', from: mysqlSchema.rawDeltas, to: sqliteSchema.rawDeltas },
  { name: 'settings', from: mysqlSchema.settings, to: sqliteSchema.settings },
  { name: 'projects', from: mysqlSchema.projects, to: sqliteSchema.projects },
]);

for (const { name, count } of results) {
  console.log(`${name}: ${count} rows ${count === 0 ? '(skip)' : 'synced'}`);
}

console.log('MySQL → SQLite sync complete');
process.exit(0);
