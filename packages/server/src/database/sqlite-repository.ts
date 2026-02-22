import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { ChatLogRepository, EventRow, SessionRow } from './repository.ts';
import * as schema from './schema-sqlite.ts';

export type SqliteDatabase = ReturnType<typeof drizzle<typeof schema>>;

export function createSqliteRepository(
  dbPath = ':memory:',
): ChatLogRepository & { db: SqliteDatabase } {
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');

  const db = drizzle(sqlite, { schema });

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      command TEXT NOT NULL,
      args TEXT NOT NULL,
      cwd TEXT,
      mode TEXT NOT NULL DEFAULT 'print',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      dir TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_session_created ON events(session_id, created_at);
  `);

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
