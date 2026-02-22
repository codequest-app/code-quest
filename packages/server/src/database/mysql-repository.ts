import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import type { ChatLogRepository, EventRow, SessionRow } from './repository.ts';
import * as schema from './schema-mysql.ts';

export function createMysqlRepository(url: string): ChatLogRepository {
  const pool = mysql.createPool(url);
  const db = drizzle(pool, { schema, mode: 'default' });

  let queue: Promise<void> = Promise.resolve();

  function enqueue(fn: () => Promise<unknown>): void {
    queue = queue
      .then(fn, () => fn())
      .then(
        () => undefined,
        (err) => {
          console.error('[MysqlChatLogRepository]', err);
        },
      );
  }

  return {
    insertSession(row: SessionRow): void {
      enqueue(() =>
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
      enqueue(() =>
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
