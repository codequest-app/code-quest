import { describe, expect, it, vi } from 'vitest';
import { Broadcaster } from '../broadcaster.ts';
import type { DataSource } from '../types.ts';

function makeSource<T>(value: T): DataSource<T> & { notify(): void; readCount: number } {
  let readCount = 0;
  const cbs = new Set<() => void>();
  return {
    get readCount() {
      return readCount;
    },
    async read() {
      readCount++;
      return value;
    },
    onChange(cb) {
      cbs.add(cb);
      return () => cbs.delete(cb);
    },
    notify() {
      for (const cb of cbs) cb();
    },
  };
}

describe('Broadcaster', () => {
  it('new subscriber receives current value immediately via read()', async () => {
    const source = makeSource('data');
    const broadcaster = new Broadcaster(() => source);
    const cb = vi.fn();
    broadcaster.subscribe('/repo', 's1', cb);
    await vi.waitUntil(() => cb.mock.calls.length > 0);
    expect(cb).toHaveBeenCalledWith('data');
  });

  it('second subscriber for same cwd gets cached lastValue synchronously', async () => {
    const source = makeSource('data');
    const broadcaster = new Broadcaster(() => source);
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    broadcaster.subscribe('/repo', 's1', cb1);
    await vi.waitUntil(() => cb1.mock.calls.length > 0);
    broadcaster.subscribe('/repo', 's2', cb2);
    expect(cb2).toHaveBeenCalledWith('data');
    expect(source.readCount).toBe(1);
  });

  it('all subscribers receive updated value when source changes', async () => {
    const source = makeSource('v1');
    const broadcaster = new Broadcaster(() => source);
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    broadcaster.subscribe('/repo', 's1', cb1);
    broadcaster.subscribe('/repo', 's2', cb2);
    await vi.waitUntil(() => cb1.mock.calls.length > 0);
    source.notify();
    await vi.waitUntil(() => cb1.mock.calls.length > 1);
    expect(cb1).toHaveBeenLastCalledWith('v1');
    expect(cb2).toHaveBeenLastCalledWith('v1');
  });

  it('last subscriber unsubscribing calls source.dispose()', async () => {
    const dispose = vi.fn();
    const broadcaster = new Broadcaster(() => ({ ...makeSource('x'), dispose }));
    const off = broadcaster.subscribe('/repo', 's1', vi.fn());
    await vi.waitUntil(() => dispose.mock.calls.length === 0);
    expect(dispose).not.toHaveBeenCalled();
    off();
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('last subscriber unsubscribing removes cwd entry', async () => {
    let sourceCreated = 0;
    const broadcaster = new Broadcaster(() => {
      sourceCreated++;
      return makeSource('x');
    });
    const cb = vi.fn();
    const off = broadcaster.subscribe('/repo', 's1', cb);
    await vi.waitUntil(() => cb.mock.calls.length > 0);
    off();
    const cb2 = vi.fn();
    broadcaster.subscribe('/repo', 's2', cb2);
    await vi.waitUntil(() => cb2.mock.calls.length > 0);
    expect(sourceCreated).toBe(2);
  });

  it('different cwds use independent sources', async () => {
    const sources: Array<ReturnType<typeof makeSource>> = [];
    const broadcaster = new Broadcaster((cwd) => {
      const s = makeSource(cwd);
      sources.push(s);
      return s;
    });
    const cbA = vi.fn();
    const cbB = vi.fn();
    broadcaster.subscribe('/a', 's1', cbA);
    broadcaster.subscribe('/b', 's2', cbB);
    await vi.waitUntil(() => cbA.mock.calls.length > 0 && cbB.mock.calls.length > 0);
    expect(cbA).toHaveBeenCalledWith('/a');
    expect(cbB).toHaveBeenCalledWith('/b');
    expect(sources).toHaveLength(2);
  });

  it('unsubscribed callback no longer receives updates', async () => {
    const source = makeSource('v1');
    const broadcaster = new Broadcaster(() => source);
    const cb = vi.fn();
    const off = broadcaster.subscribe('/repo', 's1', cb);
    await vi.waitUntil(() => cb.mock.calls.length > 0);
    off();
    source.notify();
    await new Promise((r) => setTimeout(r, 20));
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
