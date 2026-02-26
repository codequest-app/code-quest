import type { RawEntry } from '@code-quest/summoner';
import { CompositeRawStore } from '../services/composite-raw-store.ts';
import type { RawEventStore } from '../services/raw-event-store.ts';

function createMockStore(): RawEventStore & { appendCalls: RawEntry[] } {
  const appendCalls: RawEntry[] = [];
  return {
    appendCalls,
    async append(entry: RawEntry) {
      appendCalls.push(entry);
    },
    async getBySession(_sessionId: string) {
      return [];
    },
  };
}

describe('CompositeRawStore', () => {
  it('appends to all stores', async () => {
    const store1 = createMockStore();
    const store2 = createMockStore();
    const composite = new CompositeRawStore([store1, store2]);

    const entry: RawEntry = {
      timestamp: Date.now(),
      sessionId: 'sess-1',
      turnId: 1,
      direction: 'out',
      raw: 'hello',
    };

    await composite.append(entry);

    expect(store1.appendCalls).toHaveLength(1);
    expect(store2.appendCalls).toHaveLength(1);
  });

  it('reads from the first store', async () => {
    const expected: RawEntry[] = [
      { timestamp: 1, sessionId: 's', turnId: 0, direction: 'out', raw: 'a' },
    ];
    const store1: RawEventStore = {
      async append() {},
      async getBySession() {
        return expected;
      },
    };
    const store2: RawEventStore = {
      async append() {},
      async getBySession() {
        return [];
      },
    };

    const composite = new CompositeRawStore([store1, store2]);
    const results = await composite.getBySession('s');
    expect(results).toBe(expected);
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
      turnId: 0,
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
    const goodStore = createMockStore();
    const composite = new CompositeRawStore([failStore, goodStore]);

    const entry: RawEntry = {
      timestamp: Date.now(),
      sessionId: 'sess-1',
      turnId: 0,
      direction: 'out',
      raw: 'test',
    };

    await composite.append(entry);
    expect(goodStore.appendCalls).toHaveLength(1);
  });
});
