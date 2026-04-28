import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { sessions } from '../db/schema-sqlite.ts';
import { createDatabase } from '../db/sqlite-client.ts';
import { DrizzleSessionStore } from '../services/drizzle-session-store.ts';
import type { SessionRecord } from '../services/session-store.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle/sqlite');

function makeRecord(id: string, overrides?: Partial<SessionRecord>): SessionRecord {
  return {
    id,
    channelId: id,
    provider: 'claude',
    command: 'claude',
    args: '[]',
    projectRoot: overrides?.cwd ?? '/default/project',
    mode: 'print',
    role: 'chat',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('DrizzleSessionStore', () => {
  let db: ReturnType<typeof createDatabase>;
  let store: DrizzleSessionStore;

  beforeEach(() => {
    db = createDatabase(':memory:');
    migrate(db, { migrationsFolder });
    store = new DrizzleSessionStore(db, sessions);
  });

  describe('projectRoot', () => {
    it('persists projectRoot on upsert + returns it via getById', async () => {
      await store.upsert(
        makeRecord('pr-1', { cwd: '/repo/.claude/worktrees/feat-a', projectRoot: '/repo' }),
      );

      const fetched = await store.getById('pr-1');
      expect(fetched?.projectRoot).toBe('/repo');
    });

    it('projectRoot is required (non-null) and round-trips verbatim', async () => {
      await store.upsert(makeRecord('pr-2', { cwd: '/tmp/scratch', projectRoot: '/tmp/scratch' }));

      const fetched = await store.getById('pr-2');
      expect(fetched?.projectRoot).toBe('/tmp/scratch');
    });
  });

  describe('list', () => {
    it('returns sessions and total count', async () => {
      await store.upsert(makeRecord('s1'));
      await store.upsert(makeRecord('s2'));

      const result = await store.list({ limit: 10, offset: 0 });

      expect(result.total).toBe(2);
      expect(result.sessions).toHaveLength(2);
    });

    it('returns empty when no sessions', async () => {
      const result = await store.list();

      expect(result.total).toBe(0);
      expect(result.sessions).toEqual([]);
    });

    it('respects limit and offset', async () => {
      for (let i = 0; i < 5; i++) {
        await store.upsert(makeRecord(`s${i}`, { createdAt: `2026-01-0${i + 1}T00:00:00Z` }));
      }

      const result = await store.list({ limit: 2, offset: 1 });

      expect(result.total).toBe(5);
      expect(result.sessions).toHaveLength(2);
    });

    it('orders by createdAt descending', async () => {
      await store.upsert(makeRecord('old', { createdAt: '2026-01-01T00:00:00Z' }));
      await store.upsert(makeRecord('new', { createdAt: '2026-01-02T00:00:00Z' }));

      const result = await store.list();

      expect(result.sessions[0]!.channelId).toBe('new');
      expect(result.sessions[1]!.channelId).toBe('old');
    });
  });

  describe('updateStatus', () => {
    it('marks session as dead', async () => {
      await store.upsert(makeRecord('s1'));

      await store.updateStatus('s1', 'dead');

      const session = await store.getById('s1');
      expect(session!.status).toBe('dead');
    });

    it('returns false when session not found', async () => {
      const result = await store.updateStatus('nonexistent', 'dead');
      expect(result).toBe(false);
    });

    it('returns true when updated', async () => {
      await store.upsert(makeRecord('s1'));
      const result = await store.updateStatus('s1', 'dead');
      expect(result).toBe(true);
    });
  });

  describe('list', () => {
    it('excludes dead sessions by default', async () => {
      await store.upsert(makeRecord('active-sess'));
      await store.upsert(makeRecord('dead-sess'));
      await store.updateStatus('dead-sess', 'dead');

      const result = await store.list();

      expect(result.sessions.map((s) => s.channelId)).not.toContain('dead-sess');
      expect(result.sessions.map((s) => s.channelId)).toContain('active-sess');
    });

    it('total count excludes dead sessions', async () => {
      await store.upsert(makeRecord('s1'));
      await store.upsert(makeRecord('s2'));
      await store.updateStatus('s2', 'dead');

      const result = await store.list();

      expect(result.total).toBe(1);
    });
  });

  describe('getById', () => {
    it('returns session when found', async () => {
      await store.upsert(makeRecord('s1'));

      const session = await store.getById('s1');

      expect(session).not.toBeNull();
      expect(session!.channelId).toBe('s1');
    });

    it('returns null when not found', async () => {
      const session = await store.getById('nonexistent');

      expect(session).toBeNull();
    });
  });

  describe('upsert', () => {
    it('rebinds channelId and resets status on duplicate id', async () => {
      await store.upsert(makeRecord('s1', { channelId: 'ch-old' }));
      await store.updateStatus('s1', 'dead');

      await store.upsert(makeRecord('s1', { channelId: 'ch-new', status: 'dead' }));

      const row = await store.getById('s1');
      expect(row!.channelId).toBe('ch-new');
      expect(row!.status).toBe('active');
    });
  });

  describe('deleteByChannelId', () => {
    it('removes the row and returns true when channelId matches', async () => {
      await store.upsert(makeRecord('sess-1', { channelId: 'ch-A' }));

      const result = await store.deleteByChannelId('ch-A');

      expect(result).toBe(true);
      expect(await store.getById('sess-1')).toBeNull();
    });

    it('returns false when no row matches the channelId', async () => {
      const result = await store.deleteByChannelId('ch-missing');
      expect(result).toBe(false);
    });
  });

  describe('renameByChannelId', () => {
    it('updates title and returns true when channelId matches', async () => {
      await store.upsert(makeRecord('sess-1', { channelId: 'ch-A' }));

      const result = await store.renameByChannelId('ch-A', 'New Title');

      expect(result).toBe(true);
      const row = await store.getById('sess-1');
      expect(row!.title).toBe('New Title');
    });

    it('returns false when no row matches the channelId', async () => {
      const result = await store.renameByChannelId('ch-missing', 'x');
      expect(result).toBe(false);
    });
  });

  describe('list excludeSessionIds', () => {
    it('omits rows whose id is in excludeSessionIds; total reflects filter', async () => {
      await store.upsert(makeRecord('a'));
      await store.upsert(makeRecord('b'));
      await store.upsert(makeRecord('c'));

      const result = await store.list({ excludeSessionIds: ['a'] });

      const ids = result.sessions.map((s) => s.id).sort();
      expect(ids).toEqual(['b', 'c']);
      expect(result.total).toBe(2);
    });

    it('empty excludeSessionIds returns all rows (no NOT IN () SQL hazard)', async () => {
      await store.upsert(makeRecord('a'));
      await store.upsert(makeRecord('b'));

      const result = await store.list({ excludeSessionIds: [] });

      expect(result.sessions).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('updateStatusByChannelId', () => {
    it('updates status and returns true when channelId matches', async () => {
      await store.upsert(makeRecord('sess-1', { channelId: 'ch-A' }));

      const result = await store.updateStatusByChannelId('ch-A', 'dead');

      expect(result).toBe(true);
      const row = await store.getById('sess-1');
      expect(row!.status).toBe('dead');
    });

    it('returns false when no row matches the channelId', async () => {
      const result = await store.updateStatusByChannelId('ch-missing', 'dead');
      expect(result).toBe(false);
    });
  });
});
