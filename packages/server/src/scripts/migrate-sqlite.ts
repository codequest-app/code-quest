import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { config, resolveSqlitePath } from '../config.ts';
import { createDatabase } from '../db/sqlite-client.ts';

if (!config.database.sqliteUrl) {
  throw new Error(
    'DATABASE_SQLITE_URL is not set — nothing to migrate. ' +
      'Set DATABASE_SQLITE_URL in .env to run sqlite migrations.',
  );
}

const path = resolveSqlitePath(config.database.sqliteUrl);

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle/sqlite');

const db = createDatabase(path);
migrate(db, { migrationsFolder });
console.log('SQLite migration completed');
