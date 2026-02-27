import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema-mysql.ts';

export type MysqlDatabase = ReturnType<typeof createMysqlDatabase>;

export function createMysqlDatabase(url: string) {
  const pool = mysql.createPool(url);
  return drizzle(pool, { schema, mode: 'default' });
}
