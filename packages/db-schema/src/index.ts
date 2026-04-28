import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export * from './schema-columns.ts';
export * as mysqlSchema from './schema-mysql.ts';
export * as sqliteSchema from './schema-sqlite.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const sqliteMigrationsFolder = resolve(__dirname, '../drizzle/sqlite');
export const mysqlMigrationsFolder = resolve(__dirname, '../drizzle/mysql');
