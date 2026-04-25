import { segments as s } from '@code-quest/summoner/test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rawDeltas, rawEvents } from '../db/schema-sqlite.ts';
import type { DrizzleDatabase } from '../db/sqlite-client.ts';
import type { RawEventService } from '../services/raw-event-service.ts';
import { createFakeServer, createFakeSummoner, createTestContainer } from '../test/index.ts';
import { TYPES } from '../types.ts';

const configMock = vi.hoisted(() => ({
  autoMode: true,
  database: { url: undefined, sqliteUrl: 'file::memory:' },
  rawEvents: { writeDeltas: false, readDeltas: false },
  fsRoots: [],
}));

vi.mock('../config.ts', () => ({ config: configMock }));

beforeEach(() => {
  configMock.rawEvents.writeDeltas = false;
  configMock.rawEvents.readDeltas = false;
});

afterEach(() => {
  configMock.rawEvents.writeDeltas = false;
  configMock.rawEvents.readDeltas = false;
});

function deltaLine(text: string): string {
  return JSON.stringify({
    type: 'stream_event',
    event: {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'text_delta', text },
    },
  });
}

async function runTurn(sessionId: string) {
  const container = createTestContainer();
  const server = createFakeServer(container);
  const summoner = createFakeSummoner(server);
  const claude = summoner.claude();
  await claude.initialize(s.init(sessionId));

  await claude.send('chat:send', { channelId: sessionId, message: 'hi' });
  await claude.emit(deltaLine('Hel'));
  await claude.emit(deltaLine('lo'));
  await claude.emit(s.assistant('Hello'));
  await claude.emit(s.result());

  // Wait until the assistant + result rows are persisted (instead of a
  // fixed sleep — flaky on slow CI, wasteful on fast machines).
  const db = container.get<DrizzleDatabase>(TYPES.Database);
  await vi.waitFor(async () => {
    const rows = await db.select().from(rawEvents);
    if (rows.length < 2) throw new Error('persistence not settled');
  });
  return container;
}

describe('raw delta persistence — four flag quadrants', () => {
  it('WRITE=false, READ=false — clean mode: no deltas persisted, UNION skipped', async () => {
    const container = await runTurn('sess-q1');

    const db = container.get<DrizzleDatabase>(TYPES.Database);
    const deltaRows = await db.select().from(rawDeltas);
    expect(deltaRows).toEqual([]);

    const svc = container.get<RawEventService>(TYPES.RawEventService);
    const rows = await svc.getBySession('sess-q1');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => !r.raw.includes('content_block_delta'))).toBe(true);
  });

  it('WRITE=true, READ=false — quiet persist: deltas stored but not surfaced by getBySession', async () => {
    configMock.rawEvents.writeDeltas = true;
    const container = await runTurn('sess-q2');

    const db = container.get<DrizzleDatabase>(TYPES.Database);
    const deltaRows = await db.select().from(rawDeltas);
    expect(deltaRows.length).toBeGreaterThanOrEqual(2);

    const svc = container.get<RawEventService>(TYPES.RawEventService);
    const rows = await svc.getBySession('sess-q2');
    expect(rows.every((r) => !r.raw.includes('content_block_delta'))).toBe(true);
  });

  it('WRITE=true, READ=true — full debug: deltas persisted and surfaced via UNION', async () => {
    configMock.rawEvents.writeDeltas = true;
    configMock.rawEvents.readDeltas = true;
    const container = await runTurn('sess-q3');

    const db = container.get<DrizzleDatabase>(TYPES.Database);
    const deltaRows = await db.select().from(rawDeltas);
    expect(deltaRows.length).toBeGreaterThanOrEqual(2);

    const svc = container.get<RawEventService>(TYPES.RawEventService);
    const unioned = await svc.getBySession('sess-q3');
    expect(unioned.some((r) => r.raw.includes('content_block_delta'))).toBe(true);
    expect(unioned.some((r) => r.raw.startsWith('{"type":"assistant"'))).toBe(true);
  });

  it('WRITE=false, READ=true — no-op UNION: empty delta table, events still returned', async () => {
    configMock.rawEvents.readDeltas = true;
    const container = await runTurn('sess-q4');

    const db = container.get<DrizzleDatabase>(TYPES.Database);
    const deltaRows = await db.select().from(rawDeltas);
    expect(deltaRows).toEqual([]);

    const svc = container.get<RawEventService>(TYPES.RawEventService);
    const rows = await svc.getBySession('sess-q4');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => !r.raw.includes('content_block_delta'))).toBe(true);
  });
});
