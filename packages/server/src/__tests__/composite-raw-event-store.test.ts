import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RawEvent } from '@code-quest/summoner';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { rawEvents } from '../db/schema-sqlite.ts';
import { createDatabase } from '../db/sqlite-client.ts';
import { CompositeRawEventStore } from '../services/composite-raw-event-store.ts';
import { DrizzleRawEventStore } from '../services/drizzle-raw-event-store.ts';
import type { RawEventStore } from '../services/raw-event-store.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle/sqlite');

describe('CompositeRawEventStore', () => {
  let storeA: DrizzleRawEventStore;
  let storeB: DrizzleRawEventStore;

  beforeEach(() => {
    const dbA = createDatabase(':memory:');
    migrate(dbA, { migrationsFolder });
    storeA = new DrizzleRawEventStore(dbA, rawEvents);

    const dbB = createDatabase(':memory:');
    migrate(dbB, { migrationsFolder });
    storeB = new DrizzleRawEventStore(dbB, rawEvents);
  });

  it('appends to all stores', async () => {
    const composite = new CompositeRawEventStore([storeA, storeB]);

    const entry: RawEvent = {
      timestamp: Date.now(),
      sessionId: 'sess-1',
      direction: 'out',
      raw: 'hello',
      seq: 0,
    };

    await composite.append(entry);

    expect(await storeA.getBySession('sess-1')).toHaveLength(1);
    expect(await storeB.getBySession('sess-1')).toHaveLength(1);
  });

  it('reads from the first store', async () => {
    const composite = new CompositeRawEventStore([storeA, storeB]);

    const entry: RawEvent = {
      timestamp: Date.now(),
      sessionId: 'sess-1',
      direction: 'out',
      raw: 'data',
      seq: 0,
    };

    await composite.append(entry);
    const results = await composite.getBySession('sess-1');
    expect(results).toHaveLength(1);
    expect(results[0].raw).toBe('data');
  });

  it('throws when constructed with empty stores array', () => {
    expect(() => new CompositeRawEventStore([])).toThrow();
  });

  it('throws when all stores fail on append', async () => {
    const failStore1: RawEventStore = {
      async append() {
        throw new Error('fail1');
      },
      async getBySession() {
        return [];
      },
      async getPreview() {
        return {};
      },
      async cloneEvents() {},
    };
    const failStore2: RawEventStore = {
      async append() {
        throw new Error('fail2');
      },
      async getBySession() {
        return [];
      },
      async getPreview() {
        return {};
      },
      async cloneEvents() {},
    };
    const composite = new CompositeRawEventStore([failStore1, failStore2]);

    const entry: RawEvent = {
      timestamp: Date.now(),
      sessionId: 'sess-1',
      direction: 'out',
      raw: 'test',
      seq: 0,
    };

    await expect(composite.append(entry)).rejects.toThrow();
  });

  it('continues writing to other stores even if one fails', async () => {
    const failStore: RawEventStore = {
      async append() {
        throw new Error('fail');
      },
      async getBySession() {
        return [];
      },
      async getPreview() {
        return {};
      },
      async cloneEvents() {},
    };
    const composite = new CompositeRawEventStore([failStore, storeB]);

    const entry: RawEvent = {
      timestamp: Date.now(),
      sessionId: 'sess-1',
      direction: 'out',
      raw: 'test',
      seq: 0,
    };

    await composite.append(entry);
    const results = await storeB.getBySession('sess-1');
    expect(results).toHaveLength(1);
  });
});
