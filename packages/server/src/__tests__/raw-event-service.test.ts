import type { RawEvent } from '@code-quest/summoner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RawDeltaEntry, RawDeltaStore } from '../services/raw-delta-store.ts';
import { RawEventService } from '../services/raw-event-service.ts';
import type { RawEventStore } from '../services/raw-event-store.ts';

function mockEventStore(overrides: Partial<RawEventStore> = {}): RawEventStore {
  return {
    append: vi.fn(async () => 'evt-id'),
    getBySession: vi.fn(async () => []),
    getPreview: vi.fn(async () => ({})),
    cloneEvents: vi.fn(async () => {}),
    ...overrides,
  };
}

function mockDeltaStore(overrides: Partial<RawDeltaStore> = {}): RawDeltaStore {
  return {
    append: vi.fn(async () => {}),
    getBySession: vi.fn(async () => []),
    ...overrides,
  };
}

function makeEvent(overrides: Partial<RawEvent> = {}): RawEvent {
  return {
    sessionId: 'sess',
    direction: 'out',
    raw: 'x',
    seq: 0,
    timestamp: Date.now(),
    ...overrides,
  };
}

function makeDelta(overrides: Partial<RawDeltaEntry> = {}): RawDeltaEntry {
  return {
    parentId: 'parent',
    sessionId: 'sess',
    direction: 'out',
    raw: 'd',
    seq: 1,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('RawEventService', () => {
  let eventStore: RawEventStore;
  let deltaStore: RawDeltaStore;
  let service: RawEventService;

  beforeEach(() => {
    eventStore = mockEventStore();
    deltaStore = mockDeltaStore();
    service = new RawEventService(eventStore, deltaStore);
  });

  describe('appendEvent', () => {
    it('routes to eventStore.append and returns the id', async () => {
      const id = await service.appendEvent(makeEvent());
      expect(id).toBe('evt-id');
      expect(eventStore.append).toHaveBeenCalledTimes(1);
      expect(deltaStore.append).not.toHaveBeenCalled();
    });

    it('forwards caller-supplied id', async () => {
      await service.appendEvent(makeEvent(), 'custom-id');
      expect(eventStore.append).toHaveBeenCalledWith(expect.anything(), 'custom-id');
    });
  });

  describe('appendDelta', () => {
    it('routes to deltaStore.append', async () => {
      await service.appendDelta(makeDelta());
      expect(deltaStore.append).toHaveBeenCalledTimes(1);
      expect(eventStore.append).not.toHaveBeenCalled();
    });
  });

  describe('getBySession', () => {
    it('returns events only by default (no delta query made)', async () => {
      eventStore = mockEventStore({
        getBySession: vi.fn(async () => [makeEvent({ seq: 0 }), makeEvent({ seq: 2 })]),
      });
      service = new RawEventService(eventStore, deltaStore);

      const result = await service.getBySession('sess');

      expect(result.map((r) => r.seq)).toEqual([0, 2]);
      expect(deltaStore.getBySession).not.toHaveBeenCalled();
    });

    it('UNIONs events + deltas sorted by seq when includeDeltas=true', async () => {
      eventStore = mockEventStore({
        getBySession: vi.fn(async () => [
          makeEvent({ seq: 0, raw: 'E0' }),
          makeEvent({ seq: 3, raw: 'E3' }),
        ]),
      });
      deltaStore = mockDeltaStore({
        getBySession: vi.fn(async () => [
          makeDelta({ seq: 1, raw: 'D1' }),
          makeDelta({ seq: 2, raw: 'D2' }),
        ]),
      });
      service = new RawEventService(eventStore, deltaStore);

      const result = await service.getBySession('sess', { includeDeltas: true });

      expect(result.map((r) => r.raw)).toEqual(['E0', 'D1', 'D2', 'E3']);
    });

    it('explicit includeDeltas=false does not query deltas', async () => {
      await service.getBySession('sess', { includeDeltas: false });
      expect(deltaStore.getBySession).not.toHaveBeenCalled();
    });
  });

  it('getPreview delegates to eventStore only', async () => {
    await service.getPreview('sess');
    expect(eventStore.getPreview).toHaveBeenCalledWith('sess');
    expect(deltaStore.getBySession).not.toHaveBeenCalled();
  });

  it('cloneEvents delegates to eventStore only (deltas not cloned)', async () => {
    await service.cloneEvents('sess-a', 'sess-b');
    expect(eventStore.cloneEvents).toHaveBeenCalledWith('sess-a', 'sess-b');
    expect(deltaStore.getBySession).not.toHaveBeenCalled();
  });
});
