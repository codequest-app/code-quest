import express from 'express';
import request from 'supertest';
import { createSessionsRouter } from '../routes/sessions.ts';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionRecord, SessionStore } from '../services/session-store.ts';

const sessionDefaults: Omit<SessionRecord, 'channelId'> = {
  provider: 'claude',
  command: 'claude',
  args: '[]',
  mode: 'interactive',
  role: 'chat',
  createdAt: new Date().toISOString(),
};

function mockSession(overrides: { channelId: string; title?: string }): SessionRecord {
  return { ...sessionDefaults, ...overrides } as SessionRecord;
}

function createMockStore(sessions: SessionRecord[] = []): SessionStore {
  return {
    persist: vi.fn(),
    list: vi.fn().mockResolvedValue({ sessions, total: sessions.length }),
    getById: vi.fn(),
    rename: vi.fn(),
    delete: vi.fn(),
    updateStatus: vi.fn(),
  };
}

function createMockEventStore(events: unknown[] = []): RawEventStore {
  return {
    append: vi.fn(),
    getBySession: vi.fn().mockResolvedValue(events),
    getPreview: vi.fn().mockResolvedValue({}),
  };
}

describe('GET /api/sessions', () => {
  it('returns sessions from store', async () => {
    const store = createMockStore([
      mockSession({ channelId: 's1' }),
      mockSession({ channelId: 's2' }),
    ]);
    const app = express();
    app.use(createSessionsRouter(store));

    const res = await request(app).get('/api/sessions');
    expect(res.status).toBe(200);
    expect(res.body.sessions).toHaveLength(2);
    expect(store.list).toHaveBeenCalledWith({ limit: 20, offset: 0 });
  });

  it('respects limit and offset query params', async () => {
    const store = createMockStore();
    const app = express();
    app.use(createSessionsRouter(store));

    await request(app).get('/api/sessions?limit=5&offset=10');
    expect(store.list).toHaveBeenCalledWith({ limit: 5, offset: 10 });
  });

  it('returns 500 on store error', async () => {
    const store = createMockStore();
    (store.list as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('db down'));
    const app = express();
    app.use(createSessionsRouter(store));

    const res = await request(app).get('/api/sessions');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('db down');
  });
});

describe('GET /api/sessions/:id', () => {
  it('returns session by id', async () => {
    const session = { channelId: 's1', title: 'Test' };
    const store = createMockStore();
    (store.getById as ReturnType<typeof vi.fn>).mockResolvedValue(session);
    const app = express();
    app.use(createSessionsRouter(store));

    const res = await request(app).get('/api/sessions/s1');
    expect(res.status).toBe(200);
    expect(res.body.channelId).toBe('s1');
    expect(store.getById).toHaveBeenCalledWith('s1');
  });

  it('returns 404 when not found', async () => {
    const store = createMockStore();
    (store.getById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const app = express();
    app.use(createSessionsRouter(store));

    const res = await request(app).get('/api/sessions/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Session not found');
  });

  it('returns 500 on store error', async () => {
    const store = createMockStore();
    (store.getById as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
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
    const store = createMockStore();
    const eventStore = createMockEventStore(events);
    const app = express();
    app.use(createSessionsRouter(store, eventStore));

    const res = await request(app).get('/api/sessions/s1/events?limit=2&offset=1');
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(2);
    expect(res.body.events[0].seq).toBe(1);
    expect(res.body.total).toBe(5);
  });

  it('returns 501 when event store not available', async () => {
    const store = createMockStore();
    const app = express();
    app.use(createSessionsRouter(store));

    const res = await request(app).get('/api/sessions/s1/events');
    expect(res.status).toBe(501);
  });

  it('returns 500 on event store error', async () => {
    const store = createMockStore();
    const eventStore = createMockEventStore();
    (eventStore.getBySession as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('broken'));
    const app = express();
    app.use(createSessionsRouter(store, eventStore));

    const res = await request(app).get('/api/sessions/s1/events');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('broken');
  });
});

describe('GET /api/sessions with preview', () => {
  it('returns sessions enriched with preview text', async () => {
    const store = createMockStore([
      mockSession({ channelId: 's1', title: 'Session 1' }),
      mockSession({ channelId: 's2', title: 'Session 2' }),
    ]);
    const eventStore = createMockEventStore();
    (eventStore.getPreview as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ lastAssistant: 'Done' })
      .mockResolvedValueOnce({});

    const app = express();
    app.use(createSessionsRouter(store, eventStore));

    const res = await request(app).get('/api/sessions');
    expect(res.body.sessions[0].lastAssistantMessage).toBe('Done');
    expect(res.body.sessions[1].lastAssistantMessage).toBeUndefined();
  });
});
