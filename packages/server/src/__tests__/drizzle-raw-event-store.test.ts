import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RawEvent } from '@code-quest/summoner';
import { segments as s } from '@code-quest/summoner/test';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { rawEvents } from '../db/schema-sqlite.ts';
import { createDatabase } from '../db/sqlite-client.ts';
import { DrizzleRawEventStore } from '../services/drizzle-raw-event-store.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle/sqlite');

describe('DrizzleRawEventStore', () => {
  let db: ReturnType<typeof createDatabase>;
  let store: DrizzleRawEventStore;

  beforeEach(() => {
    db = createDatabase(':memory:');
    migrate(db, { migrationsFolder });
    store = new DrizzleRawEventStore(db, rawEvents);
  });

  it('appends and retrieves raw entries via getBySession', async () => {
    const entry: RawEvent = {
      timestamp: Date.now(),
      sessionId: 'sess-1',
      direction: 'out',
      raw: s.assistant('hello'),
      seq: 0,
    };

    await store.append(entry);
    const results = await store.getBySession('sess-1');

    expect(results).toHaveLength(1);
    expect(results[0].sessionId).toBe('sess-1');
    expect(results[0].direction).toBe('out');
    expect(results[0].raw).toBe(entry.raw);
  });

  it('returns empty array for unknown session', async () => {
    const results = await store.getBySession('nonexistent');
    expect(results).toEqual([]);
  });

  it('appends multiple entries for same session', async () => {
    for (let i = 0; i < 3; i++) {
      await store.append({
        timestamp: Date.now() + i,
        sessionId: 'sess-3',
        direction: 'out',
        raw: `line ${i}`,
        seq: i,
      });
    }

    const results = await store.getBySession('sess-3');
    expect(results).toHaveLength(3);
  });

  describe('getPreview', () => {
    it('returns last assistant text', async () => {
      const now = Date.now();
      await store.append({
        timestamp: now,
        sessionId: 'sess-p',
        direction: 'out',
        raw: s.assistant('Looking at the code'),
        seq: 0,
      });
      await store.append({
        timestamp: now + 1,
        sessionId: 'sess-p',
        direction: 'out',
        raw: s.assistant('Fixed the bug'),
        seq: 1,
      });

      const preview = await store.getPreview('sess-p');
      expect(preview.lastAssistant).toBe('Fixed the bug');
    });

    it('returns empty for unknown session', async () => {
      const preview = await store.getPreview('nonexistent');
      expect(preview.lastAssistant).toBeUndefined();
    });

    it('returns empty when no assistant messages', async () => {
      await store.append({
        timestamp: Date.now(),
        sessionId: 'sess-u',
        direction: 'in',
        raw: JSON.stringify({
          type: 'user',
          message: { content: [{ type: 'text', text: 'hello' }] },
        }),
        seq: 0,
      });

      const preview = await store.getPreview('sess-u');
      expect(preview.lastAssistant).toBeUndefined();
    });
  });

  it('returns entries ordered by createdAt', async () => {
    const now = Date.now();
    await store.append({
      timestamp: now + 200,
      sessionId: 'sess-4',
      direction: 'out',
      raw: 'c',
      seq: 2,
    });
    await store.append({
      timestamp: now,
      sessionId: 'sess-4',
      direction: 'out',
      raw: 'a',
      seq: 0,
    });
    await store.append({
      timestamp: now + 100,
      sessionId: 'sess-4',
      direction: 'out',
      raw: 'b',
      seq: 1,
    });

    const results = await store.getBySession('sess-4');
    expect(results.map((r) => r.raw)).toEqual(['a', 'b', 'c']);
  });

  describe('cloneEvents', () => {
    it('copies rows under a new sessionId with re-sequenced seq', async () => {
      const now = Date.now();
      for (let i = 0; i < 3; i++) {
        await store.append({
          timestamp: now + i,
          sessionId: 'sess-parent',
          direction: i === 0 ? 'in' : 'out',
          raw: `raw-${i}`,
          seq: i,
        });
      }

      await store.cloneEvents('sess-parent', 'sess-new');
      const cloned = await store.getBySession('sess-new');

      expect(cloned).toHaveLength(3);
      expect(cloned.map((r) => r.sessionId)).toEqual(['sess-new', 'sess-new', 'sess-new']);
      expect(cloned.map((r) => r.raw)).toEqual(['raw-0', 'raw-1', 'raw-2']);
      expect(cloned.map((r) => r.direction)).toEqual(['in', 'out', 'out']);
      expect(cloned.map((r) => r.seq)).toEqual([1, 2, 3]);
    });

    it('is a no-op when source has zero rows', async () => {
      await store.cloneEvents('sess-empty', 'sess-dest');
      const rows = await store.getBySession('sess-dest');
      expect(rows).toEqual([]);
    });

    it('rejects cloning to the same sessionId', async () => {
      await expect(store.cloneEvents('sess-x', 'sess-x')).rejects.toThrow();
    });
  });
});
