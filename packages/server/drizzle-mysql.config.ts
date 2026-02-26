import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'mysql',
  schema: './src/db/schema-mysql.ts',
  out: './drizzle/mysql',
});
