import { FakeWatchService } from '@code-quest/test-kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DirtyBroadcaster } from '../dirty-broadcaster.ts';

describe('DirtyBroadcaster', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // Default matcher + transform: match every path, pass paths through as-is.
  // Most tests use this shape — dedicated helpers avoid generic cast gymnastics.
  const allPaths = (): boolean => true;
  const asPaths = (paths: string[]): string[] => paths;

  function setupPaths(matcher: (path: string) => boolean = allPaths) {
    const watch = new FakeWatchService();
    const broadcaster = new DirtyBroadcaster<string[]>(watch, matcher, asPaths);
    return { watch, broadcaster };
  }

  function setupTyped<P>(matcher: (path: string) => boolean, transform: (paths: string[]) => P) {
    const watch = new FakeWatchService();
    const broadcaster = new DirtyBroadcaster<P>(watch, matcher, transform);
    return { watch, broadcaster };
  }

  it('matching path + debounce 200 ms → callback fires with transformed payload', () => {
    const { watch, broadcaster } = setupPaths();
    const cb = vi.fn();
    broadcaster.subscribe('/repo', 's1', cb);

    watch.simulate('/repo', { type: 'change', path: 'src/foo.ts' });
    expect(cb).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(cb).toHaveBeenCalledWith(['src/foo.ts']);
  });

  it('non-matching path → buffer not filled, no emit', () => {
    const onlyTs = (p: string) => p.endsWith('.ts');
    const { watch, broadcaster } = setupPaths(onlyTs);
    const cb = vi.fn();
    broadcaster.subscribe('/repo', 's1', cb);

    watch.simulate('/repo', { type: 'change', path: 'README.md' });
    vi.advanceTimersByTime(200);
    expect(cb).not.toHaveBeenCalled();
  });

  it('storm: 100 events coalesce into one batch', () => {
    const { watch, broadcaster } = setupPaths();
    const cb = vi.fn<(paths: string[]) => void>();
    broadcaster.subscribe('/repo', 's1', cb);

    for (let i = 0; i < 100; i++) {
      watch.simulate('/repo', { type: 'change', path: `src/file${i}.ts` });
    }
    vi.advanceTimersByTime(200);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0]![0].length).toBe(100);
  });

  it('void payload: transform returns undefined → callback fires without paths leaking', () => {
    const { watch, broadcaster } = setupTyped<void>(allPaths, () => undefined);
    const cb = vi.fn();
    broadcaster.subscribe('/repo', 's1', cb);

    watch.simulate('/repo', { type: 'change', path: 'src/foo.ts' });
    watch.simulate('/repo', { type: 'change', path: 'src/bar.ts' });
    vi.advanceTimersByTime(200);

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(undefined);
  });

  it('same (cwd, subscriberId) pair refcounted → needs all unsubscribes to tear down', () => {
    const { watch, broadcaster } = setupPaths();
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const off1 = broadcaster.subscribe('/repo', 's1', cb1);
    const off2 = broadcaster.subscribe('/repo', 's1', cb2);

    off1(); // still refcount=1
    watch.simulate('/repo', { type: 'change', path: 'x.ts' });
    vi.advanceTimersByTime(200);
    // One delivery total (latest cb wins)
    expect(cb1.mock.calls.length + cb2.mock.calls.length).toBe(1);

    off2(); // refcount=0, fully released
    watch.simulate('/repo', { type: 'change', path: 'y.ts' });
    vi.advanceTimersByTime(200);
    expect(cb1.mock.calls.length + cb2.mock.calls.length).toBe(1); // no further
  });

  it('different subscriberIds on same cwd both receive', () => {
    const { watch, broadcaster } = setupPaths();
    const a = vi.fn();
    const b = vi.fn();
    broadcaster.subscribe('/repo', 's1', a);
    broadcaster.subscribe('/repo', 's2', b);

    watch.simulate('/repo', { type: 'change', path: 'x.ts' });
    vi.advanceTimersByTime(200);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('different cwds isolated', () => {
    const { watch, broadcaster } = setupPaths();
    const a = vi.fn();
    const b = vi.fn();
    broadcaster.subscribe('/repo-a', 's1', a);
    broadcaster.subscribe('/repo-b', 's2', b);

    watch.simulate('/repo-a', { type: 'change', path: 'x.ts' });
    vi.advanceTimersByTime(200);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
  });

  it('unsubscribe stops further delivery', () => {
    const { watch, broadcaster } = setupPaths();
    const cb = vi.fn();
    const off = broadcaster.subscribe('/repo', 's1', cb);

    watch.simulate('/repo', { type: 'change', path: 'a.ts' });
    vi.advanceTimersByTime(200);
    expect(cb).toHaveBeenCalledTimes(1);

    off();
    watch.simulate('/repo', { type: 'change', path: 'b.ts' });
    vi.advanceTimersByTime(200);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('second subscriber on same cwd does not re-subscribe underlying WatchService', () => {
    const { watch, broadcaster } = setupPaths();
    const cb = vi.fn();
    broadcaster.subscribe('/repo', 's1', cb);
    const subscribeSpy = vi.spyOn(watch, 'subscribe');
    broadcaster.subscribe('/repo', 's2', vi.fn());
    expect(subscribeSpy).not.toHaveBeenCalled();
  });

  it('no subscribers → no chokidar subscribe', () => {
    const { watch } = setupPaths();
    const subscribeSpy = vi.spyOn(watch, 'subscribe');
    expect(subscribeSpy).not.toHaveBeenCalled();
  });
});
