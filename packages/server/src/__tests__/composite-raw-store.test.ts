import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RawEntry } from '@code-quest/summoner';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { rawEntries, sessions } from '../db/schema-sqlite.ts';
import { createDatabase } from '../db/sqlite-client.ts';
import { CompositeRawStore } from '../services/composite-raw-store.ts';
import { DrizzleRawStore } from '../services/drizzle-raw-store.ts';
import { FileRawStore } from '../services/file-raw-store.ts';
import type { RawEventStore } from '../services/raw-event-store.ts';

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

describe('CompositeRawStore', () => {
  let db: ReturnType<typeof createDatabase>;
  let drizzleStore: DrizzleRawStore;
  let fileStore: FileRawStore;
  let tmpDir: string;

  beforeEach(() => {
    db = createDatabase(':memory:');
    migrate(db, { migrationsFolder });
    drizzleStore = new DrizzleRawStore(db, rawEntries);
    tmpDir = mkdtempSync(join(tmpdir(), 'composite-raw-'));
    fileStore = new FileRawStore(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('appends to all stores', async () => {
    seedSession(db, 'sess-1');
    const composite = new CompositeRawStore([drizzleStore, fileStore]);

    const entry: RawEntry = {
      timestamp: Date.now(),
      sessionId: 'sess-1',
      promptId: 'prompt-1',
      direction: 'out',
      raw: 'hello',
    };

    await composite.append(entry);

    const drizzleResults = await drizzleStore.getBySession('sess-1');
    const fileResults = await fileStore.getBySession('sess-1');
    expect(drizzleResults).toHaveLength(1);
    expect(fileResults).toHaveLength(1);
  });

  it('reads from the first store', async () => {
    seedSession(db, 'sess-1');
    const composite = new CompositeRawStore([drizzleStore, fileStore]);

    const entry: RawEntry = {
      timestamp: Date.now(),
      sessionId: 'sess-1',
      promptId: 'prompt-0',
      direction: 'out',
      raw: 'data',
    };

    await composite.append(entry);
    const results = await composite.getBySession('sess-1');
    expect(results).toHaveLength(1);
    expect(results[0].raw).toBe('data');
  });

  it('throws when constructed with empty stores array', () => {
    expect(() => new CompositeRawStore([])).toThrow();
  });

  it('throws when all stores fail on append', async () => {
    const failStore1: RawEventStore = {
      async append() {
        throw new Error('fail1');
      },
      async getBySession() {
        return [];
      },
    };
    const failStore2: RawEventStore = {
      async append() {
        throw new Error('fail2');
      },
      async getBySession() {
        return [];
      },
    };
    const composite = new CompositeRawStore([failStore1, failStore2]);

    const entry: RawEntry = {
      timestamp: Date.now(),
      sessionId: 'sess-1',
      promptId: 'prompt-0',
      direction: 'out',
      raw: 'test',
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
    };
    const composite = new CompositeRawStore([failStore, fileStore]);

    const entry: RawEntry = {
      timestamp: Date.now(),
      sessionId: 'sess-1',
      promptId: 'prompt-0',
      direction: 'out',
      raw: 'test',
    };

    await composite.append(entry);
    const results = await fileStore.getBySession('sess-1');
    expect(results).toHaveLength(1);
  });
});
