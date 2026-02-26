import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';
import * as schema from './schema-mysql.ts';

export type MysqlDatabase = ReturnType<typeof createMysqlDrizzle>;

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultMigrationsFolder = resolve(__dirname, '../../drizzle/mysql');

function createMysqlDrizzle(connection: mysql.Pool) {
  return drizzle(connection, { schema, mode: 'default' });
}

export async function createMysqlDatabase(
  url: string,
  migrationsFolder = defaultMigrationsFolder,
): Promise<MysqlDatabase> {
  const pool = mysql.createPool(url);
  const db = createMysqlDrizzle(pool);

  await migrate(db, { migrationsFolder });

  return db;
}
