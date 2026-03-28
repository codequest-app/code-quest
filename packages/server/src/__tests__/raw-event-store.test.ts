import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RawEntry } from '@code-quest/summoner';
import { segments as s } from '@code-quest/summoner/test';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { rawEntries } from '../db/schema-sqlite.ts';
import { createDatabase } from '../db/sqlite-client.ts';
import { DrizzleRawStore } from '../services/drizzle-raw-store.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle/sqlite');

describe('DrizzleRawStore', () => {
  let db: ReturnType<typeof createDatabase>;
  let store: DrizzleRawStore;

  beforeEach(() => {
    db = createDatabase(':memory:');
    migrate(db, { migrationsFolder });
    store = new DrizzleRawStore(db, rawEntries);
  });

  it('appends and retrieves raw entries via getBySession', async () => {
    const entry: RawEntry = {
      timestamp: Date.now(),
      sessionId: 'sess-1',
      promptId: 'prompt-aaa',
      direction: 'out',
      raw: s.assistant('hello'),
      seq: 0,
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
    for (let i = 0; i < 3; i++) {
      await store.append({
        timestamp: Date.now() + i,
        sessionId: 'sess-3',
        promptId: `prompt-${i}`,
        direction: 'out',
        raw: `line ${i}`,
        seq: i,
      });
    }

    const results = await store.getBySession('sess-3');
    expect(results).toHaveLength(3);
  });

  describe('getPreview', () => {
    it('returns first user and last assistant text', async () => {
      const now = Date.now();
      await store.append({
        timestamp: now,
        sessionId: 'sess-p',
        promptId: 'p1',
        direction: 'in',
        raw: JSON.stringify({
          type: 'user',
          message: { content: [{ type: 'text', text: 'fix the bug' }] },
        }),
        seq: 0,
      });
      await store.append({
        timestamp: now + 1,
        sessionId: 'sess-p',
        promptId: 'p1',
        direction: 'out',
        raw: s.assistant('Looking at the code'),
        seq: 1,
      });
      await store.append({
        timestamp: now + 2,
        sessionId: 'sess-p',
        promptId: 'p1',
        direction: 'out',
        raw: s.assistant('Fixed the bug'),
        seq: 2,
      });

      const preview = await store.getPreview('sess-p');
      expect(preview.firstUser).toBe('fix the bug');
      expect(preview.lastAssistant).toBe('Fixed the bug');
    });

    it('returns empty for unknown session', async () => {
      const preview = await store.getPreview('nonexistent');
      expect(preview.firstUser).toBeUndefined();
      expect(preview.lastAssistant).toBeUndefined();
    });

    it('returns only firstUser when no assistant messages', async () => {
      await store.append({
        timestamp: Date.now(),
        sessionId: 'sess-u',
        promptId: 'p1',
        direction: 'in',
        raw: JSON.stringify({
          type: 'user',
          message: { content: [{ type: 'text', text: 'hello' }] },
        }),
        seq: 0,
      });

      const preview = await store.getPreview('sess-u');
      expect(preview.firstUser).toBe('hello');
      expect(preview.lastAssistant).toBeUndefined();
    });

    it('returns only lastAssistant when no user messages', async () => {
      await store.append({
        timestamp: Date.now(),
        sessionId: 'sess-a',
        promptId: 'p1',
        direction: 'out',
        raw: s.assistant('hi there'),
        seq: 0,
      });

      const preview = await store.getPreview('sess-a');
      expect(preview.firstUser).toBeUndefined();
      expect(preview.lastAssistant).toBe('hi there');
    });
  });

  it('returns entries ordered by createdAt', async () => {
    const now = Date.now();
    await store.append({
      timestamp: now + 200,
      sessionId: 'sess-4',
      promptId: 'prompt-c',
      direction: 'out',
      raw: 'c',
      seq: 2,
    });
    await store.append({
      timestamp: now,
      sessionId: 'sess-4',
      promptId: 'prompt-a',
      direction: 'out',
      raw: 'a',
      seq: 0,
    });
    await store.append({
      timestamp: now + 100,
      sessionId: 'sess-4',
      promptId: 'prompt-b',
      direction: 'out',
      raw: 'b',
      seq: 1,
    });

    const results = await store.getBySession('sess-4');
    expect(results.map((r) => r.raw)).toEqual(['a', 'b', 'c']);
  });
});
