import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { ChatLogRepository, EventRow, SessionRow } from './repository.ts';
import * as schema from './schema-sqlite.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type SqliteDatabase = ReturnType<typeof drizzle<typeof schema>>;

export function createSqliteRepository(
  dbPath = ':memory:',
): ChatLogRepository & { db: SqliteDatabase } {
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');

  const db = drizzle(sqlite, { schema });

  migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle/sqlite') });

  return {
    db,
    insertSession(row: SessionRow): void {
      db.insert(schema.sessions)
        .values({
          id: row.id,
          provider: row.provider,
          command: row.command,
          args: row.args,
          cwd: row.cwd,
          mode: row.mode,
          role: row.role,
          parentId: row.parentId,
          createdAt: row.createdAt,
        })
        .run();
    },
    insertEvent(row: EventRow): void {
      db.insert(schema.events)
        .values({
          sessionId: row.sessionId,
          dir: row.dir,
          type: row.type,
          data: row.data,
          createdAt: row.createdAt,
        })
        .run();
    },
  };
}
