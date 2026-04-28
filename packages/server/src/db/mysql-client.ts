import type { MySql2Database } from 'drizzle-orm/mysql2';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema-mysql.ts';

export type MysqlDatabase = MySql2Database<typeof schema>;

export function createMysqlDatabase(url: string): MysqlDatabase {
  const pool = mysql.createPool(url);
  return drizzle(pool, { schema, mode: 'default' });
}
