import { describe, expect, it, vi } from 'vitest';
import { LocalBroadcaster } from '../broadcaster.ts';
import type { DataSourceLike } from '../types.ts';

function makeSource<T>(value: T): DataSourceLike<T> & { notify(): void; readCount: number } {
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
  it('add() returns this for chaining', () => {
    const broadcaster = new LocalBroadcaster();
    const result = broadcaster.add('files', () => makeSource([]));
    expect(result).toBe(broadcaster);
  });

  it('new subscriber receives cb(type, data) for each registered type', async () => {
    const broadcaster = new LocalBroadcaster()
      .add('files', () => makeSource(['a.ts']))
      .add('git', () => makeSource({ branch: 'main' }));
    const cb = vi.fn();
    broadcaster.subscribe('/repo', 's1', cb);
    await vi.waitUntil(() => cb.mock.calls.length >= 2);
    expect(cb).toHaveBeenCalledWith('files', ['a.ts']);
    expect(cb).toHaveBeenCalledWith('git', { branch: 'main' });
  });

  it('second subscriber for same cwd gets cached lastValue synchronously', async () => {
    const source = makeSource('data');
    const broadcaster = new LocalBroadcaster().add('files', () => source);
    const cb1 = vi.fn();
    broadcaster.subscribe('/repo', 's1', cb1);
    await vi.waitUntil(() => cb1.mock.calls.length > 0);

    const cb2 = vi.fn();
    broadcaster.subscribe('/repo', 's2', cb2);
    expect(cb2).toHaveBeenCalledWith('files', 'data');
    expect(source.readCount).toBe(1);
  });

  it('all subscribers receive cb(type, data) when a DataSource changes', async () => {
    const source = makeSource('v1');
    const broadcaster = new LocalBroadcaster().add('files', () => source);
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    broadcaster.subscribe('/repo', 's1', cb1);
    broadcaster.subscribe('/repo', 's2', cb2);
    await vi.waitUntil(() => cb1.mock.calls.length > 0);

    source.notify();
    await vi.waitUntil(() => cb1.mock.calls.length > 1);
    expect(cb1).toHaveBeenLastCalledWith('files', 'v1');
    expect(cb2).toHaveBeenLastCalledWith('files', 'v1');
  });

  it('only the changed type emits — other types stay silent', async () => {
    const filesSource = makeSource(['a.ts']);
    const gitSource = makeSource({ branch: 'main' });
    const broadcaster = new LocalBroadcaster()
      .add('files', () => filesSource)
      .add('git', () => gitSource);
    const cb = vi.fn();
    broadcaster.subscribe('/repo', 's1', cb);
    await vi.waitUntil(() => cb.mock.calls.length >= 2);
    cb.mockClear();

    filesSource.notify();
    await vi.waitUntil(() => cb.mock.calls.length > 0);
    expect(cb).toHaveBeenCalledWith('files', ['a.ts']);
    expect(cb).not.toHaveBeenCalledWith('git', expect.anything());
  });

  it('last subscriber unsubscribing disposes all DataSources for that cwd', async () => {
    const dispose = vi.fn();
    const broadcaster = new LocalBroadcaster().add('files', () => ({
      ...makeSource('x'),
      dispose,
    }));
    const cb = vi.fn();
    const off = broadcaster.subscribe('/repo', 's1', cb);
    await vi.waitUntil(() => cb.mock.calls.length > 0);
    off();
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('last subscriber unsubscribing removes cwd entry so next subscribe creates fresh sources', async () => {
    let sourceCreated = 0;
    const broadcaster = new LocalBroadcaster().add('files', () => {
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

  it('different cwds use independent DataSource instances', async () => {
    const cwds: string[] = [];
    const broadcaster = new LocalBroadcaster().add('files', (cwd) => {
      cwds.push(cwd);
      return makeSource(cwd);
    });
    const cbA = vi.fn();
    const cbB = vi.fn();
    broadcaster.subscribe('/a', 's1', cbA);
    broadcaster.subscribe('/b', 's2', cbB);
    await vi.waitUntil(() => cbA.mock.calls.length > 0 && cbB.mock.calls.length > 0);
    expect(cbA).toHaveBeenCalledWith('files', '/a');
    expect(cbB).toHaveBeenCalledWith('files', '/b');
    expect(cwds).toEqual(['/a', '/b']);
  });

  it('second subscriber joining while initial read is in-flight receives correct data', async () => {
    let resolveRead!: (v: string) => void;
    const source: DataSourceLike<string> & { notify(): void } = {
      read() {
        return new Promise<string>((res) => {
          resolveRead = res;
        });
      },
      onChange(_cb) {
        return () => {};
      },
      notify() {},
    };
    const broadcaster = new LocalBroadcaster().add('files', () => source);
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    broadcaster.subscribe('/repo', 's1', cb1);
    broadcaster.subscribe('/repo', 's2', cb2);

    resolveRead('the-data');
    await vi.waitUntil(() => cb1.mock.calls.length > 0 && cb2.mock.calls.length > 0);

    expect(cb1).toHaveBeenCalledWith('files', 'the-data');
    expect(cb2).toHaveBeenCalledWith('files', 'the-data');
  });

  it('unsubscribed callback no longer receives updates', async () => {
    const source = makeSource('v1');
    const broadcaster = new LocalBroadcaster().add('files', () => source);
    const cb = vi.fn();
    const off = broadcaster.subscribe('/repo', 's1', cb);
    await vi.waitUntil(() => cb.mock.calls.length > 0);
    off();

    source.notify();
    await new Promise((r) => setTimeout(r, 20));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('single subscribe covers all registered types without extra subscribe calls', async () => {
    const broadcaster = new LocalBroadcaster()
      .add('files', () => makeSource(['a.ts']))
      .add('git', () => makeSource({ branch: 'main' }))
      .add('openspec', () => makeSource({ changes: [] }));
    const cb = vi.fn();
    broadcaster.subscribe('/repo', 's1', cb);
    await vi.waitUntil(() => cb.mock.calls.length >= 3);
    const types = cb.mock.calls.map(([type]) => type);
    expect(types).toContain('files');
    expect(types).toContain('git');
    expect(types).toContain('openspec');
  });
});
