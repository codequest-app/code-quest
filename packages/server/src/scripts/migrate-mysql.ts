import { mysqlMigrationsFolder } from '@code-quest/db-schema';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';

import { config } from '../config.ts';

const url = config.database.url;
if (!url) {
  console.error('DATABASE_URL is not set — nothing to migrate.');
  process.exit(1);
}

const conn = await mysql.createConnection(url);
const db = drizzle(conn);
await migrate(db, { migrationsFolder: mysqlMigrationsFolder });
await conn.end();
console.log('MySQL migration completed');
process.exit(0);
