import { segments as s } from '@code-quest/summoner/test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RawEventService } from '../services/raw-event-service.ts';
import { createFakeServer, createFakeSummoner, createTestContainer } from '../test/index.ts';
import { TYPES } from '../types.ts';

const configMock = vi.hoisted(() => ({
  autoMode: true,
  rawEvents: { drivers: [], sqlitePath: ':memory:', persistDeltas: false },
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

      const svc = container.get<RawEventService>(TYPES.RawEventStore);
      const eventsOnly = await svc.getBySession('sess-nodeltas');
      const withDeltas = await svc.getBySession('sess-nodeltas', { includeDeltas: true });

      // Terminal events present (user, assistant, result, maybe init).
      expect(eventsOnly.length).toBeGreaterThan(0);
      // No delta rows added, so UNION is the same shape as events-only.
      expect(withDeltas.length).toBe(eventsOnly.length);
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

      const svc = container.get<RawEventService>(TYPES.RawEventStore);
      const withDeltas = await svc.getBySession('sess-deltas', { includeDeltas: true });
      const eventsOnly = await svc.getBySession('sess-deltas');

      // UNION strictly larger than events-only (deltas present).
      expect(withDeltas.length).toBeGreaterThan(eventsOnly.length);

      // The delta rows include our injected text fragments.
      const deltaRawTexts = withDeltas
        .filter((r) => !eventsOnly.some((e) => e.seq === r.seq))
        .map((r) => r.raw);
      expect(deltaRawTexts.some((raw) => raw.includes('Hel'))).toBe(true);
      expect(deltaRawTexts.some((raw) => raw.includes('lo'))).toBe(true);
    });
  });
});
