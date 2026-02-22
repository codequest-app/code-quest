import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';
import type { ChatLogRepository, EventRow, SessionRow } from './repository.ts';
import * as schema from './schema-mysql.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createMysqlRepository(url: string): ChatLogRepository {
  const pool = mysql.createPool(url);
  const db = drizzle(pool, { schema, mode: 'default' });

  let queue: Promise<void> = initDatabase(url, db as Parameters<typeof migrate>[0]);

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

async function initDatabase(url: string, db: Parameters<typeof migrate>[0]): Promise<void> {
  const parsed = new URL(url);
  const dbName = parsed.pathname.replace('/', '');

  const initUrl = new URL(url);
  initUrl.pathname = '/';
  const initConnection = await mysql.createConnection(initUrl.toString());
  await initConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await initConnection.end();

  await migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle/mysql') });
}
