import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { beforeEach, describe, expect, it } from 'vitest';
import { rawDeltas } from '../db/schema-sqlite.ts';
import { createDatabase } from '../db/sqlite-client.ts';
import { DrizzleRawDeltaStore } from '../services/drizzle-raw-delta-store.ts';
import type { RawDeltaEntry } from '../services/raw-delta-store.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle/sqlite');

function makeEntry(overrides: Partial<RawDeltaEntry> = {}): RawDeltaEntry {
  return {
    parentId: 'parent-xyz',
    sessionId: 'sess-1',
    direction: 'out',
    raw: '{"type":"stream_event","event":{"type":"content_block_delta"}}',
    seq: 0,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('DrizzleRawDeltaStore', () => {
  let store: DrizzleRawDeltaStore;

  beforeEach(() => {
    const db = createDatabase(':memory:');
    migrate(db, { migrationsFolder });
    store = new DrizzleRawDeltaStore(db, rawDeltas);
  });

  it('appends and retrieves via getBySession', async () => {
    await store.append(makeEntry({ raw: 'delta-1' }));
    const results = await store.getBySession('sess-1');

    expect(results).toHaveLength(1);
    expect(results[0]!.parentId).toBe('parent-xyz');
    expect(results[0]!.raw).toBe('delta-1');
    expect(results[0]!.sessionId).toBe('sess-1');
    expect(results[0]!.direction).toBe('out');
  });

  it('preserves parent_id across multiple inserts', async () => {
    await store.append(makeEntry({ parentId: 'parent-A', raw: 'a-1', seq: 0 }));
    await store.append(makeEntry({ parentId: 'parent-A', raw: 'a-2', seq: 1 }));
    await store.append(makeEntry({ parentId: 'parent-B', raw: 'b-1', seq: 2 }));

    const results = await store.getBySession('sess-1');
    expect(results.map((r) => r.parentId)).toEqual(['parent-A', 'parent-A', 'parent-B']);
  });

  it('returns results ordered by seq / createdAt', async () => {
    const now = Date.now();
    await store.append(makeEntry({ raw: 'c', seq: 2, timestamp: now + 20 }));
    await store.append(makeEntry({ raw: 'a', seq: 0, timestamp: now }));
    await store.append(makeEntry({ raw: 'b', seq: 1, timestamp: now + 10 }));

    const results = await store.getBySession('sess-1');
    expect(results.map((r) => r.raw)).toEqual(['a', 'b', 'c']);
  });

  it('returns empty array for unknown session', async () => {
    expect(await store.getBySession('nope')).toEqual([]);
  });

  it('scopes getBySession by sessionId', async () => {
    await store.append(makeEntry({ sessionId: 'A', raw: 'a' }));
    await store.append(makeEntry({ sessionId: 'B', raw: 'b' }));

    expect((await store.getBySession('A')).map((r) => r.raw)).toEqual(['a']);
    expect((await store.getBySession('B')).map((r) => r.raw)).toEqual(['b']);
  });
});
