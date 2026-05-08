import { mysqlMigrationsFolder } from '@code-quest/db-schema';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';

import { config } from '../config.ts';
import { parseDatabaseType } from '../db/create-database.ts';

const mysqlUrl = config.database.find((url) => parseDatabaseType(url) === 'mysql');
if (!mysqlUrl) {
  console.error('No MySQL database configured — nothing to migrate.');
  process.exit(1);
}

const conn = await mysql.createConnection(mysqlUrl);
const db = drizzle(conn);
await migrate(db, { migrationsFolder: mysqlMigrationsFolder });
await conn.end();
console.log('MySQL migration completed');
process.exit(0);
