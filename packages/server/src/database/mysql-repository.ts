import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import type { ChatLogRepository, EventRow, SessionRow } from './repository.ts';
import * as schema from './schema-mysql.ts';

export function createMysqlRepository(url: string): ChatLogRepository {
  const pool = mysql.createPool(url);
  const db = drizzle(pool, { schema, mode: 'default' });

  const ready = initDatabase(url, pool);

  return {
    insertSession(row: SessionRow): void {
      ready.then(() =>
        db.insert(schema.sessions).values({
          id: row.id,
          provider: row.provider,
          command: row.command,
          args: row.args,
          cwd: row.cwd,
          mode: row.mode,
          createdAt: row.createdAt,
        }),
      );
    },
    insertEvent(row: EventRow): void {
      ready.then(() =>
        db.insert(schema.events).values({
          sessionId: row.sessionId,
          dir: row.dir,
          type: row.type,
          data: row.data,
          createdAt: row.createdAt,
        }),
      );
    },
  };
}

async function initDatabase(url: string, pool: mysql.Pool): Promise<void> {
  const parsed = new URL(url);
  const dbName = parsed.pathname.replace('/', '');

  const initUrl = new URL(url);
  initUrl.pathname = '/';
  const initConnection = await mysql.createConnection(initUrl.toString());
  await initConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await initConnection.end();

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(36) PRIMARY KEY,
      provider VARCHAR(20) NOT NULL,
      command VARCHAR(255) NOT NULL,
      args TEXT NOT NULL,
      cwd TEXT,
      mode VARCHAR(20) NOT NULL DEFAULT 'print',
      created_at VARCHAR(30) NOT NULL
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id INT PRIMARY KEY AUTO_INCREMENT,
      session_id VARCHAR(36) NOT NULL,
      dir VARCHAR(10) NOT NULL,
      type VARCHAR(100) NOT NULL,
      data TEXT NOT NULL,
      created_at VARCHAR(30) NOT NULL,
      INDEX idx_events_session_created (session_id, created_at),
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    )
  `);
}
