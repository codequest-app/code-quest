import type { RawEntry } from '@code-quest/summoner';
import { sql } from 'drizzle-orm';
import { createDatabase } from '../db/client.ts';
import { sessions } from '../db/schema.ts';
import { SqliteRawStore } from '../services/raw-event-store.ts';

function createTestDb() {
  const db = createDatabase(':memory:');
  db.run(sql`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY NOT NULL,
    provider TEXT NOT NULL,
    command TEXT NOT NULL,
    args TEXT NOT NULL,
    cwd TEXT,
    mode TEXT NOT NULL DEFAULT 'print',
    role TEXT NOT NULL DEFAULT 'chat',
    parent_id TEXT,
    created_at TEXT NOT NULL
  )`);
  db.run(sql`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    dir TEXT NOT NULL,
    type TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);
  return db;
}

function seedSession(db: ReturnType<typeof createDatabase>, id: string) {
  db.insert(sessions)
    .values({
      id,
      provider: 'claude',
      command: 'claude',
      args: '[]',
      createdAt: new Date().toISOString(),
    })
    .run();
}

describe('SqliteRawStore', () => {
  let db: ReturnType<typeof createDatabase>;
  let store: SqliteRawStore;

  beforeEach(() => {
    db = createTestDb();
    store = new SqliteRawStore(db);
  });

  it('appends and retrieves raw events', async () => {
    seedSession(db, 'sess-1');

    const entry: RawEntry = {
      timestamp: Date.now(),
      sessionId: 'sess-1',
      turnId: 1,
      direction: 'out',
      raw: '{"type":"text","content":"hello"}',
      parsed: [{ type: 'text', content: 'hello' }],
    };

    await store.append(entry);
    const results = await store.getBySession('sess-1');

    expect(results).toHaveLength(1);
    expect(results[0].sessionId).toBe('sess-1');
    expect(results[0].direction).toBe('out');
    expect(results[0].raw).toBe(entry.raw);
    expect(results[0].parsed).toEqual(entry.parsed);
    expect(results[0].turnId).toBe(1);
  });

  it('returns empty array for unknown session', async () => {
    const results = await store.getBySession('nonexistent');
    expect(results).toEqual([]);
  });

  it('appends entry without parsed field', async () => {
    seedSession(db, 'sess-2');

    const entry: RawEntry = {
      timestamp: Date.now(),
      sessionId: 'sess-2',
      turnId: 0,
      direction: 'err',
      raw: 'some error',
    };

    await store.append(entry);
    const results = await store.getBySession('sess-2');

    expect(results).toHaveLength(1);
    expect(results[0].direction).toBe('err');
    expect(results[0].parsed).toBeUndefined();
  });

  it('appends multiple events for same session', async () => {
    seedSession(db, 'sess-3');

    for (let i = 0; i < 3; i++) {
      await store.append({
        timestamp: Date.now() + i,
        sessionId: 'sess-3',
        turnId: i,
        direction: 'out',
        raw: `line ${i}`,
      });
    }

    const results = await store.getBySession('sess-3');
    expect(results).toHaveLength(3);
  });
});
