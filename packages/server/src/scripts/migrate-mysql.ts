import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const parsed = new URL(url);
const dbName = parsed.pathname.replace('/', '');

// Create database if not exists
const initUrl = new URL(url);
initUrl.pathname = '/';
const initConnection = await mysql.createConnection(initUrl.toString());
await initConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
await initConnection.end();

// Run migrations
const connection = await mysql.createConnection(url);
const db = drizzle(connection);
await migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle/mysql') });
await connection.end();

console.log('MySQL migrations applied successfully');
