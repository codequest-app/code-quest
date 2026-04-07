import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { SocketProvider } from '../../contexts/SocketContext';
import { createFakeSummoner } from '../../test/fake-summoner';
import { useExplorerBrowse } from '../useExplorerBrowse';

describe('useExplorerBrowse', () => {
  it('browse() returns directories from server', async () => {
    const summoner = createFakeSummoner();
    summoner.filesystem().setRoots(['/projects']);
    summoner.filesystem().addDirectory('/projects', ['app', 'blog']);
    await summoner.claude().initialize();

    function Wrapper({ children }: { children: ReactNode }) {
      return <SocketProvider socket={summoner.socket}>{children}</SocketProvider>;
    }

    const { result } = renderHook(() => useExplorerBrowse(), { wrapper: Wrapper });
    const dirs = await result.current.browse();

    expect(dirs).toEqual([{ name: 'projects', path: '/projects' }]);
  });

  it('browse(path) returns children', async () => {
    const summoner = createFakeSummoner();
    summoner.filesystem().setRoots(['/projects']);
    summoner.filesystem().addDirectory('/projects', ['app', 'blog']);
    await summoner.claude().initialize();

    function Wrapper({ children }: { children: ReactNode }) {
      return <SocketProvider socket={summoner.socket}>{children}</SocketProvider>;
    }

    const { result } = renderHook(() => useExplorerBrowse(), { wrapper: Wrapper });
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

    function Wrapper({ children }: { children: ReactNode }) {
      return <SocketProvider socket={summoner.socket}>{children}</SocketProvider>;
    }

    const { result } = renderHook(() => useExplorerBrowse(), { wrapper: Wrapper });
    const dirs = await result.current.browse('/unknown');

    expect(dirs).toEqual([]);
  });
});
