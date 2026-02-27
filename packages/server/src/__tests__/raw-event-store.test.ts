import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RawEntry } from '@code-quest/summoner';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { rawEntries, sessions } from '../db/schema-sqlite.ts';
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
    store = new DrizzleRawStore(db, rawEntries);
  });

  it('appends and retrieves raw entries', async () => {
    seedSession(db, 'sess-1');

    const entry: RawEntry = {
      timestamp: Date.now(),
      sessionId: 'sess-1',
      promptId: 'prompt-aaa',
      direction: 'out',
      raw: '{"type":"text","content":"hello"}',
    };

    await store.append(entry);
    const results = await store.getBySession('sess-1');

    expect(results).toHaveLength(1);
    expect(results[0].sessionId).toBe('sess-1');
    expect(results[0].promptId).toBe('prompt-aaa');
    expect(results[0].direction).toBe('out');
    expect(results[0].raw).toBe(entry.raw);
  });

  it('returns empty array for unknown session', async () => {
    const results = await store.getBySession('nonexistent');
    expect(results).toEqual([]);
  });

  it('appends multiple entries for same session', async () => {
    seedSession(db, 'sess-3');

    for (let i = 0; i < 3; i++) {
      await store.append({
        timestamp: Date.now() + i,
        sessionId: 'sess-3',
        promptId: `prompt-${i}`,
        direction: 'out',
        raw: `line ${i}`,
      });
    }

    const results = await store.getBySession('sess-3');
    expect(results).toHaveLength(3);
  });

  it('returns entries ordered by createdAt', async () => {
    seedSession(db, 'sess-4');

    const now = Date.now();
    await store.append({
      timestamp: now + 200,
      sessionId: 'sess-4',
      promptId: 'prompt-c',
      direction: 'out',
      raw: 'c',
    });
    await store.append({
      timestamp: now,
      sessionId: 'sess-4',
      promptId: 'prompt-a',
      direction: 'out',
      raw: 'a',
    });
    await store.append({
      timestamp: now + 100,
      sessionId: 'sess-4',
      promptId: 'prompt-b',
      direction: 'out',
      raw: 'b',
    });

    const results = await store.getBySession('sess-4');
    expect(results.map((r) => r.raw)).toEqual(['a', 'b', 'c']);
  });
});
