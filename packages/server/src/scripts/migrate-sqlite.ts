import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { createDatabase } from '../db/sqlite-client.ts';

const path = process.env.DB_SQLITE_PATH ?? './data/code-quest.db';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle/sqlite');

const db = createDatabase(path);
migrate(db, { migrationsFolder });
console.log('SQLite migration completed');
