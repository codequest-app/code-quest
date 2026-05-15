import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { createFakeSummoner } from '@/test/fake-summoner';
import { FsProvider, useFsBrowse } from '../FsContext.tsx';
import { SocketProvider } from '../SocketContext.tsx';

describe('useFsBrowse', () => {
  function createWrapper(summoner: ReturnType<typeof createFakeSummoner>) {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <SocketProvider socket={summoner.socket}>
          <FsProvider>{children}</FsProvider>
        </SocketProvider>
      );
    };
  }

  it('browse() returns directories from server', async () => {
    const summoner = createFakeSummoner();
    summoner.filesystem().setRoots(['/projects']);
    summoner.filesystem().addDirectory('/projects', ['app', 'blog']);
    await summoner.claude().initialize();

    const { result } = renderHook(() => useFsBrowse(), { wrapper: createWrapper(summoner) });
    const dirs = await result.current.browse();

    expect(dirs).toEqual([{ name: 'projects', path: '/projects' }]);
  });

  it('browse(path) returns children', async () => {
    const summoner = createFakeSummoner();
    summoner.filesystem().setRoots(['/projects']);
    summoner.filesystem().addDirectory('/projects', ['app', 'blog']);
    await summoner.claude().initialize();

    const { result } = renderHook(() => useFsBrowse(), { wrapper: createWrapper(summoner) });
    const dirs = await result.current.browse('/projects');

    expect(dirs).toEqual([
      { name: 'app', path: '/projects/app' },
      { name: 'blog', path: '/projects/blog' },
    ]);
  });

  it('returns empty array for unknown path', async () => {
    const summoner = createFakeSummoner();
    summoner.filesystem().setRoots(['/projects']);
    await summoner.claude().initialize();

    const { result } = renderHook(() => useFsBrowse(), { wrapper: createWrapper(summoner) });
    const dirs = await result.current.browse('/unknown');

    expect(dirs).toEqual([]);
  });
});
