import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projects } from '../db/schema-sqlite.ts';
import { createDatabase } from '../db/sqlite-client.ts';
import { DrizzleProjectStore } from '../services/project-store.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle/sqlite');

describe('DrizzleProjectStore', () => {
  let db: ReturnType<typeof createDatabase>;
  let store: DrizzleProjectStore;

  beforeEach(() => {
    vi.useFakeTimers();
    db = createDatabase(':memory:');
    migrate(db, { migrationsFolder });
    store = new DrizzleProjectStore(db, projects);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('upsert', () => {
    it('inserts new project on first call with defaults', async () => {
      const p = await store.upsert('/Users/x/cc-office');
      expect(p.path).toBe('/Users/x/cc-office');
      expect(p.name).toBe('cc-office');
      expect(p.pinned).toBe(false);
      expect(p.color).toBeNull();
      expect(p.id).toMatch(/^[0-9a-f-]+$/i);
      expect(p.createdAt).toBeTruthy();
      expect(p.lastOpenedAt).toBe(p.createdAt);
    });

    it('returns same id for duplicate path', async () => {
      const a = await store.upsert('/Users/x/foo');
      const b = await store.upsert('/Users/x/foo');
      expect(a.id).toBe(b.id);
      expect(await store.list()).toHaveLength(1);
    });

    it('updates lastOpenedAt on duplicate', async () => {
      const a = await store.upsert('/Users/x/foo');
      vi.advanceTimersByTime(10);
      const b = await store.upsert('/Users/x/foo');
      expect(new Date(b.lastOpenedAt).getTime()).toBeGreaterThan(
        new Date(a.lastOpenedAt).getTime(),
      );
    });

    it('does not overwrite name on duplicate', async () => {
      const a = await store.upsert('/Users/x/foo');
      await store.update(a.id, { name: 'My Foo' });
      const b = await store.upsert('/Users/x/foo');
      expect(b.name).toBe('My Foo');
    });

    it('does not overwrite pinned/color on duplicate', async () => {
      const a = await store.upsert('/Users/x/foo');
      await store.update(a.id, { pinned: true, color: '#abcdef' });
      const b = await store.upsert('/Users/x/foo');
      expect(b.pinned).toBe(true);
      expect(b.color).toBe('#abcdef');
    });
  });

  describe('list', () => {
    it('returns empty array initially', async () => {
      expect(await store.list()).toEqual([]);
    });

    it('orders pinned-first then by lastOpenedAt desc', async () => {
      const a = await store.upsert('/a');
      vi.advanceTimersByTime(5);
      await store.upsert('/b');
      vi.advanceTimersByTime(5);
      await store.upsert('/c');
      await store.update(a.id, { pinned: true });
      const list = await store.list();
      expect(list.map((p) => p.path)).toEqual(['/a', '/c', '/b']);
    });

    it('hydrates pinned as boolean', async () => {
      await store.upsert('/p');
      const [first] = await store.list();
      expect(typeof first!.pinned).toBe('boolean');
    });
  });

  describe('getById / getByPath', () => {
    it('returns null for unknown id', async () => {
      expect(await store.getById('not-a-uuid')).toBeNull();
    });

    it('returns null for unknown path', async () => {
      expect(await store.getByPath('/nope')).toBeNull();
    });

    it('returns project by id', async () => {
      const a = await store.upsert('/foo');
      const found = await store.getById(a.id);
      expect(found?.path).toBe('/foo');
    });

    it('returns project by path', async () => {
      await store.upsert('/foo');
      const found = await store.getByPath('/foo');
      expect(found?.name).toBe('foo');
    });
  });

  describe('update', () => {
    it('updates name', async () => {
      const a = await store.upsert('/foo');
      const updated = await store.update(a.id, { name: 'NewName' });
      expect(updated?.name).toBe('NewName');
      expect((await store.getById(a.id))?.name).toBe('NewName');
    });

    it('updates pinned', async () => {
      const a = await store.upsert('/foo');
      const updated = await store.update(a.id, { pinned: true });
      expect(updated?.pinned).toBe(true);
    });

    it('returns null for unknown id', async () => {
      expect(await store.update('nope', { name: 'X' })).toBeNull();
    });

    it('only updates specified fields', async () => {
      const a = await store.upsert('/foo');
      await store.update(a.id, { name: 'Bar' });
      const after = await store.getById(a.id);
      expect(after?.pinned).toBe(false);
      expect(after?.color).toBeNull();
    });
  });

  describe('remove', () => {
    it('removes by id', async () => {
      const a = await store.upsert('/foo');
      await store.remove(a.id);
      expect(await store.list()).toEqual([]);
    });

    it('is idempotent for unknown id', async () => {
      await expect(store.remove('not-found')).resolves.toBeUndefined();
    });
  });
});
