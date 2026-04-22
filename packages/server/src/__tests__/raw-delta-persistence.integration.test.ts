import { segments as s } from '@code-quest/summoner/test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rawDeltas } from '../db/schema-sqlite.ts';
import type { DrizzleDatabase } from '../db/sqlite-client.ts';
import type { RawEventService } from '../services/raw-event-service.ts';
import { createFakeServer, createFakeSummoner, createTestContainer } from '../test/index.ts';
import { TYPES } from '../types.ts';

const configMock = vi.hoisted(() => ({
  autoMode: true,
  database: { url: undefined, sqliteUrl: 'file::memory:' },
  rawEvents: { persistDeltas: false },
  explorerRoots: [],
}));

vi.mock('../config.ts', () => ({ config: configMock }));

beforeEach(() => {
  configMock.rawEvents.persistDeltas = false;
});

afterEach(() => {
  configMock.rawEvents.persistDeltas = false;
});

/** Minimal delta stream event from the CLI. */
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

describe('raw delta persistence (end-to-end via RawRecorder)', () => {
  describe('RAW_EVENTS_PERSIST_DELTAS=false (default)', () => {
    it('does not persist content_block_delta rows; terminal events still stored', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const summoner = createFakeSummoner(server);
      const claude = summoner.claude();
      await claude.initialize(s.init('sess-nodeltas'));

      await claude.send('chat:send', { channelId: 'sess-nodeltas', message: 'hi' });
      await claude.emit(deltaLine('Hel'));
      await claude.emit(deltaLine('lo'));
      await claude.emit(s.assistant('Hello'));
      await claude.emit(s.result());

      // raw_deltas should be empty; service.getBySession (UNION) returns only events.
      const db = container.get<DrizzleDatabase>(TYPES.Database);
      const deltaRows = await db.select().from(rawDeltas);
      expect(deltaRows).toEqual([]);

      const svc = container.get<RawEventService>(TYPES.RawEventStore);
      const rows = await svc.getBySession('sess-nodeltas');
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((r) => !r.raw.includes('content_block_delta'))).toBe(true);
    });
  });

  describe('RAW_EVENTS_PERSIST_DELTAS=true', () => {
    it('persists deltas to raw_deltas with parent_id pointing at the user stdin row', async () => {
      configMock.rawEvents.persistDeltas = true;
      const container = createTestContainer();
      const server = createFakeServer(container);
      const summoner = createFakeSummoner(server);
      const claude = summoner.claude();
      await claude.initialize(s.init('sess-deltas'));

      await claude.send('chat:send', { channelId: 'sess-deltas', message: 'hi' });
      await claude.emit(deltaLine('Hel'));
      await claude.emit(deltaLine('lo'));
      await claude.emit(s.assistant('Hello'));
      await claude.emit(s.result());

      // Wait for async persistence to settle.
      await new Promise((r) => setTimeout(r, 50));

      const db = container.get<DrizzleDatabase>(TYPES.Database);
      const deltaRows = await db.select().from(rawDeltas);
      expect(deltaRows.length).toBeGreaterThanOrEqual(2);
      expect(deltaRows.some((r) => String(r.raw).includes('Hel'))).toBe(true);
      expect(deltaRows.some((r) => String(r.raw).includes('lo'))).toBe(true);

      // Service.getBySession UNIONs by default: includes both events and deltas.
      const svc = container.get<RawEventService>(TYPES.RawEventStore);
      const unioned = await svc.getBySession('sess-deltas');
      const hasDelta = unioned.some((r) => r.raw.includes('content_block_delta'));
      const hasAssistant = unioned.some((r) => r.raw.startsWith('{"type":"assistant"'));
      expect(hasDelta).toBe(true);
      expect(hasAssistant).toBe(true);
    });
  });
});
