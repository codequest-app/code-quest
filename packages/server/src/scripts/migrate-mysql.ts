import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { createMysqlDatabase } from '../db/mysql-client.ts';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle/mysql');

const db = createMysqlDatabase(url);
await migrate(db, { migrationsFolder });
console.log('MySQL migration completed');
process.exit(0);
