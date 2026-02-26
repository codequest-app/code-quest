import { createMysqlDatabase } from '../db/mysql-client.ts';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

await createMysqlDatabase(url);
console.log('MySQL migration completed');
process.exit(0);
