import { createFakeServer, createTestContainer, TYPES } from '@code-quest/server/test';
import type { FakeWatchService } from '@code-quest/summoner/test';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FakeSummoner } from '@/test/fake-summoner';
import { FsProvider, useFsActions } from '../FsContext.tsx';
import { SocketProvider } from '../SocketContext.tsx';

function makeEnv() {
  const container = createTestContainer();
  const server = createFakeServer(container);
  const summoner = new FakeSummoner(server);
  summoner.filesystem().setRoots(['/repo']);
  const watch = container.get<FakeWatchService>(TYPES.WatchService);
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SocketProvider socket={summoner.socket}>
        <FsProvider>{children}</FsProvider>
      </SocketProvider>
    );
  }
  return { Wrapper, summoner, watch };
}

describe('FsContext pub/sub', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('two subscribers for the same cwd produce exactly one server-side watch', () => {
    const { Wrapper, watch } = makeEnv();

    const { result } = renderHook(() => useFsActions(), { wrapper: Wrapper });
    expect(watch.isWatching('/repo')).toBe(false);

    const off1 = result.current.subscribeFsDirty('/repo', vi.fn());
    expect(watch.isWatching('/repo')).toBe(true);
    const countAfterFirst = watch.subscriberCount('/repo');

    const off2 = result.current.subscribeFsDirty('/repo', vi.fn());
    expect(watch.subscriberCount('/repo')).toBe(countAfterFirst);

    off1();
    off2();
  });

  it('both subscribers releasing removes the server-side watch', () => {
    const { Wrapper, watch } = makeEnv();

    const { result } = renderHook(() => useFsActions(), { wrapper: Wrapper });
    const off1 = result.current.subscribeFsDirty('/repo', vi.fn());
    const off2 = result.current.subscribeFsDirty('/repo', vi.fn());

    off1();
    expect(watch.isWatching('/repo')).toBe(true);
    off2();
    expect(watch.isWatching('/repo')).toBe(false);
  });

  it('unsubscribe is idempotent (second call no-op)', () => {
    const { Wrapper, watch } = makeEnv();

    const { result } = renderHook(() => useFsActions(), { wrapper: Wrapper });
    const off = result.current.subscribeFsDirty('/repo', vi.fn());
    off();
    off();

    expect(watch.isWatching('/repo')).toBe(false);
  });

  it('files:dirty for a watched cwd fires the callback with paths', async () => {
    const { Wrapper, watch } = makeEnv();

    const { result } = renderHook(() => useFsActions(), { wrapper: Wrapper });
    const cb = vi.fn<(paths: string[]) => void>();
    const off = result.current.subscribeFsDirty('/repo', cb);

    await act(async () => {
      watch.simulate('/repo', { type: 'change', path: 'src/foo.ts' });
      watch.simulate('/repo', { type: 'change', path: 'src/bar.ts' });
    });

    await waitFor(() => {
      expect(cb).toHaveBeenCalled();
    });
    expect([...cb.mock.calls[0]![0]].sort()).toEqual(['src/bar.ts', 'src/foo.ts']);

    off();
  });

  it('different cwds isolated — only matching subscriber fires', async () => {
    const { Wrapper, watch, summoner } = makeEnv();
    summoner.filesystem().setRoots(['/repo', '/other']);

    const { result } = renderHook(() => useFsActions(), { wrapper: Wrapper });
    const cbRepo = vi.fn();
    const cbOther = vi.fn();
    const offA = result.current.subscribeFsDirty('/repo', cbRepo);
    const offB = result.current.subscribeFsDirty('/other', cbOther);

    await act(async () => {
      watch.simulate('/repo', { type: 'change', path: 'a.ts' });
    });

    await waitFor(() => {
      expect(cbRepo).toHaveBeenCalledTimes(1);
    });
    expect(cbOther).not.toHaveBeenCalled();

    offA();
    offB();
  });
});
