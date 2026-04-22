import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { config } from '../config.ts';
import { createDatabase } from '../db/sqlite-client.ts';

const path = config.rawEvents.sqlitePath;

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle/sqlite');

const db = createDatabase(path);
migrate(db, { migrationsFolder });
console.log('SQLite migration completed');
