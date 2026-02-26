import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.ts';

export type DrizzleDatabase = ReturnType<typeof createDatabase>;

export function createDatabase(path = ':memory:') {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
  const sqlite = new Database(path);
  sqlite.pragma('journal_mode = WAL');
  const db = drizzle(sqlite, { schema });

  db.run(sql`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL DEFAULT 'claude',
    command TEXT NOT NULL DEFAULT 'claude',
    args TEXT NOT NULL DEFAULT '[]',
    cwd TEXT,
    mode TEXT NOT NULL DEFAULT 'print',
    role TEXT NOT NULL DEFAULT 'chat',
    parent_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    dir TEXT NOT NULL,
    type TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_events_session_created ON events(session_id, created_at)`,
  );

  return db;
}
