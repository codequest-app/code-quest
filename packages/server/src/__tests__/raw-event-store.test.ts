import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RawEntry } from '@code-quest/summoner';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { events, sessions } from '../db/schema-sqlite.ts';
import { createDatabase } from '../db/sqlite-client.ts';
import { DrizzleRawStore } from '../services/drizzle-raw-store.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle/sqlite');

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

describe('DrizzleRawStore', () => {
  let db: ReturnType<typeof createDatabase>;
  let store: DrizzleRawStore;

  beforeEach(() => {
    db = createDatabase(':memory:');
    migrate(db, { migrationsFolder });
    store = new DrizzleRawStore(db, events);
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

  it('returns events ordered by createdAt', async () => {
    seedSession(db, 'sess-4');

    const now = Date.now();
    await store.append({
      timestamp: now + 200,
      sessionId: 'sess-4',
      turnId: 2,
      direction: 'out',
      raw: 'c',
    });
    await store.append({
      timestamp: now,
      sessionId: 'sess-4',
      turnId: 0,
      direction: 'out',
      raw: 'a',
    });
    await store.append({
      timestamp: now + 100,
      sessionId: 'sess-4',
      turnId: 1,
      direction: 'out',
      raw: 'b',
    });

    const results = await store.getBySession('sess-4');
    expect(results.map((r) => r.raw)).toEqual(['a', 'b', 'c']);
  });
});
