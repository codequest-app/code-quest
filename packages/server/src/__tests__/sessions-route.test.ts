import { sqliteMigrationsFolder } from '@code-quest/db-schema';
import { sessions } from '@code-quest/db-schema/sqlite';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import express from 'express';
import request from 'supertest';
import { createDatabase } from '../db/sqlite-client.ts';
import { createSessionsRouter } from '../routes/sessions.ts';
import { DrizzleSessionStore } from '../services/drizzle-session-store.ts';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionRecord } from '../services/session-store.ts';

function makeRecord(id: string, overrides?: Partial<SessionRecord>): SessionRecord {
  return {
    id,
    channelId: id,
    provider: 'claude',
    command: 'claude',
    args: '[]',
    projectRoot: '/test/project',
    mode: 'interactive',
    role: 'chat',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function createInMemoryStore(seed: SessionRecord[] = []) {
  const db = createDatabase(':memory:');
  migrate(db, { migrationsFolder: sqliteMigrationsFolder });
  const store = new DrizzleSessionStore(db, sessions);
  return { db, store, seed };
}

async function setupApp(
  seed: SessionRecord[] = [],
  eventStore?: RawEventStore,
): Promise<express.Express> {
  const { store } = createInMemoryStore();
  for (const record of seed) await store.upsert(record);
  const app = express();
  app.use(createSessionsRouter(store, eventStore));
  return app;
}

function createStubEventStore(overrides?: Partial<RawEventStore>): RawEventStore {
  return {
    append: vi.fn(),
    getBySession: vi.fn().mockResolvedValue([]),
    getPreview: vi.fn().mockResolvedValue({}),
    cloneEvents: vi.fn(),
    ...overrides,
  };
}

describe('GET /api/sessions', () => {
  it('returns sessions from store', async () => {
    const app = await setupApp([makeRecord('s1'), makeRecord('s2')]);

    const res = await request(app).get('/api/sessions');
    expect(res.status).toBe(200);
    expect(res.body.sessions).toHaveLength(2);
  });

  it('respects limit and offset query params', async () => {
    const seed = Array.from({ length: 5 }, (_, i) =>
      makeRecord(`s${i}`, { createdAt: `2026-01-0${i + 1}T00:00:00Z` }),
    );
    const app = await setupApp(seed);

    const res = await request(app).get('/api/sessions?limit=2&offset=1');
    expect(res.status).toBe(200);
    expect(res.body.sessions).toHaveLength(2);
  });

  it('returns 500 on store error', async () => {
    const { store } = createInMemoryStore();
    vi.spyOn(store, 'list').mockRejectedValue(new Error('db down'));
    const app = express();
    app.use(createSessionsRouter(store));

    const res = await request(app).get('/api/sessions');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('db down');
  });

  it('clamps limit to 1 minimum when negative', async () => {
    const seed = Array.from({ length: 3 }, (_, i) => makeRecord(`s${i}`));
    const app = await setupApp(seed);

    const res = await request(app).get('/api/sessions?limit=-5');
    expect(res.status).toBe(200);
    expect(res.body.sessions).toHaveLength(1);
  });

  it('clamps limit to 100 maximum', async () => {
    const seed = Array.from({ length: 5 }, (_, i) => makeRecord(`s${i}`));
    const app = await setupApp(seed);

    const res = await request(app).get('/api/sessions?limit=999');
    expect(res.status).toBe(200);
    expect(res.body.sessions).toHaveLength(5);
  });

  it('defaults limit to 20 when not provided', async () => {
    const { store } = createInMemoryStore();
    const listSpy = vi.spyOn(store, 'list').mockResolvedValue({ sessions: [], total: 0 });
    const app = express();
    app.use(createSessionsRouter(store));

    await request(app).get('/api/sessions');
    expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 20 }));
  });
});

describe('GET /api/sessions/:id', () => {
  it('returns session by id', async () => {
    const app = await setupApp([makeRecord('s1', { title: 'Test' })]);

    const res = await request(app).get('/api/sessions/s1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('s1');
    expect(res.body.title).toBe('Test');
  });

  it('returns 404 when not found', async () => {
    const app = await setupApp();

    const res = await request(app).get('/api/sessions/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Session not found');
  });

  it('returns 500 on store error', async () => {
    const { store } = createInMemoryStore();
    vi.spyOn(store, 'getById').mockRejectedValue(new Error('fail'));
    const app = express();
    app.use(createSessionsRouter(store));

    const res = await request(app).get('/api/sessions/s1');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('fail');
  });
});

describe('GET /api/sessions/:id/events', () => {
  it('returns events with pagination', async () => {
    const events = Array.from({ length: 5 }, (_, i) => ({ seq: i }));
    const eventStore = createStubEventStore({
      getBySession: vi.fn().mockResolvedValue(events),
    });
    const app = await setupApp([], eventStore);

    const res = await request(app).get('/api/sessions/s1/events?limit=2&offset=1');
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(2);
    expect(res.body.events[0].seq).toBe(1);
    expect(res.body.total).toBe(5);
  });

  it('returns 501 when event store not available', async () => {
    const app = await setupApp();

    const res = await request(app).get('/api/sessions/s1/events');
    expect(res.status).toBe(501);
  });

  it('clamps events limit to 1000 maximum', async () => {
    const events = Array.from({ length: 5 }, (_, i) => ({ seq: i }));
    const eventStore = createStubEventStore({
      getBySession: vi.fn().mockResolvedValue(events),
    });
    const app = await setupApp([], eventStore);

    const res = await request(app).get('/api/sessions/s1/events?limit=9999');
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(5);
  });

  it('defaults events limit to 100 when not provided', async () => {
    const events = Array.from({ length: 5 }, (_, i) => ({ seq: i }));
    const eventStore = createStubEventStore({
      getBySession: vi.fn().mockResolvedValue(events),
    });
    const app = await setupApp([], eventStore);

    const res = await request(app).get('/api/sessions/s1/events');
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(5);
  });

  it('returns 500 on event store error', async () => {
    const eventStore = createStubEventStore({
      getBySession: vi.fn().mockRejectedValue(new Error('broken')),
    });
    const app = await setupApp([], eventStore);

    const res = await request(app).get('/api/sessions/s1/events');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('broken');
  });
});

describe('GET /api/sessions with preview', () => {
  it('returns sessions enriched with preview text', async () => {
    const seed = [
      makeRecord('s1', { title: 'Session 1' }),
      makeRecord('s2', { title: 'Session 2' }),
    ];
    const eventStore = createStubEventStore({
      getPreview: vi
        .fn()
        .mockResolvedValueOnce({ lastAssistant: 'Done' })
        .mockResolvedValueOnce({}),
    });
    const app = await setupApp(seed, eventStore);

    const res = await request(app).get('/api/sessions');
    expect(res.body.sessions[0].lastAssistantMessage).toBe('Done');
    expect(res.body.sessions[1].lastAssistantMessage).toBeUndefined();
  });
});
