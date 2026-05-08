import { mysqlSchema, sqliteSchema } from '@code-quest/db-schema';
import { resolveSqlitePath } from '../config.ts';
import { createMysqlDatabase, type MysqlDatabase } from './mysql-client.ts';
import { createDatabase } from './sqlite-client.ts';

type DatabaseType = 'sqlite' | 'mysql';

export type DatabaseEntry =
  | {
      type: 'sqlite';
      url: string;
      db: ReturnType<typeof createDatabase>;
      schema: typeof sqliteSchema;
    }
  | { type: 'mysql'; url: string; db: MysqlDatabase; schema: typeof mysqlSchema };

export function parseDatabaseType(url: string): DatabaseType {
  if (url.startsWith('mysql://') || url.startsWith('mysql2://')) return 'mysql';
  if (url.startsWith('file:') || url.startsWith('./') || url.startsWith('/')) return 'sqlite';
  throw new Error(
    `Unsupported database URL: "${url}". Supported: mysql://, mysql2://, file:, or bare path.`,
  );
}

export function createDatabaseFromUrl(url: string): DatabaseEntry {
  const type = parseDatabaseType(url);
  switch (type) {
    case 'mysql':
      return { type: 'mysql', url, db: createMysqlDatabase(url), schema: mysqlSchema };
    case 'sqlite':
      return {
        type: 'sqlite',
        url,
        db: createDatabase(resolveSqlitePath(url)),
        schema: sqliteSchema,
      };
  }
}
