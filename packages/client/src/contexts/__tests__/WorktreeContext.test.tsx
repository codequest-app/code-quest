import { createFakeServer } from '@code-quest/server/test';
import { act, renderHook } from '@testing-library/react';
import { type ReactNode, useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { FakeSummoner } from '../../test/fake-summoner';
import { SocketProvider } from '../SocketContext';
import { useWorktreeActions, useWorktreeState, WorktreeProvider } from '../WorktreeContext';

function useWorktree() {
  return { ...useWorktreeState(), ...useWorktreeActions() };
}

describe('WorktreeContext', () => {
  it('useWorktreeState throws when used outside provider', () => {
    expect(() => renderHook(() => useWorktreeState())).toThrow(
      /useWorktreeState must be used within WorktreeProvider/,
    );
  });

  it('state exposes only domain data (listing) — no dialog UI flags', () => {
    const server = createFakeServer();
    function Wrapper({ children }: { children: ReactNode }) {
      const ref = useRef<FakeSummoner | null>(null);
      if (!ref.current) ref.current = new FakeSummoner(server);
      return (
        <SocketProvider socket={ref.current.socket}>
          <WorktreeProvider>{children}</WorktreeProvider>
        </SocketProvider>
      );
    }
    const { result } = renderHook(() => useWorktreeState(), { wrapper: Wrapper });
    expect(Object.keys(result.current).sort()).toEqual(['listing']);
  });

  it('useWorktree returns an actions object with create/list/remove', () => {
    const server = createFakeServer();
    function Wrapper({ children }: { children: ReactNode }) {
      const ref = useRef<FakeSummoner | null>(null);
      if (!ref.current) ref.current = new FakeSummoner(server);
      return (
        <SocketProvider socket={ref.current.socket}>
          <WorktreeProvider>{children}</WorktreeProvider>
        </SocketProvider>
      );
    }
    const { result } = renderHook(() => useWorktree(), { wrapper: Wrapper });
    expect(typeof result.current.create).toBe('function');
    expect(typeof result.current.list).toBe('function');
    expect(typeof result.current.remove).toBe('function');
  });

  it('list() returns worktrees from the server and caches by cwd', async () => {
    const server = createFakeServer();
    const primingSummoner = new FakeSummoner(server);
    // Prime git service with a worktree via the first connection.
    const firstConn = primingSummoner.socket;
    void firstConn;
    // FakeSummoner exposes git() via `summoner.git()`.
    primingSummoner.git()!.setProjectRoot('/repo');
    primingSummoner.git()!.addWorktree({
      name: 'seeded',
      path: '/repo/.claude/worktrees/seeded',
      branch: 'worktree-seeded',
    });

    function Wrapper({ children }: { children: ReactNode }) {
      const summonerRef = useRef<FakeSummoner | null>(null);
      if (!summonerRef.current) summonerRef.current = new FakeSummoner(server);
      return (
        <SocketProvider socket={summonerRef.current.socket}>
          <WorktreeProvider>{children}</WorktreeProvider>
        </SocketProvider>
      );
    }
    const { result } = renderHook(() => useWorktree(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.list('/repo');
    });
    expect(result.current.listing['/repo']?.some((w) => w.name === 'seeded')).toBe(true);
  });

  it('remove() invalidates cached listing entry', async () => {
    const server = createFakeServer();
    const primingSummoner = new FakeSummoner(server);
    primingSummoner.git()!.setProjectRoot('/repo');
    primingSummoner.git()!.addWorktree({
      name: 'doomed',
      path: '/repo/.claude/worktrees/doomed',
      branch: 'worktree-doomed',
    });

    function Wrapper({ children }: { children: ReactNode }) {
      const summonerRef = useRef<FakeSummoner | null>(null);
      if (!summonerRef.current) summonerRef.current = new FakeSummoner(server);
      return (
        <SocketProvider socket={summonerRef.current.socket}>
          <WorktreeProvider>{children}</WorktreeProvider>
        </SocketProvider>
      );
    }
    const { result } = renderHook(() => useWorktree(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.list('/repo');
    });
    expect(result.current.listing['/repo']?.some((w) => w.name === 'doomed')).toBe(true);

    await act(async () => {
      await result.current.remove('/repo', 'doomed');
    });
    expect(result.current.listing['/repo']?.some((w) => w.name === 'doomed')).toBe(false);
  });
});
