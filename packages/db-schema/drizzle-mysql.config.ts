import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'mysql',
  schema: './src/schema-mysql.ts',
  out: './drizzle/mysql',
});
