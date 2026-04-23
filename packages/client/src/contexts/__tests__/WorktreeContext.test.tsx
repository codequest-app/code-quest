import { createFakeServer } from '@code-quest/server/test';
import type { WorktreeInfo } from '@code-quest/shared';
import { act, renderHook } from '@testing-library/react';
import { type ReactNode, useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { FakeSummoner } from '../../test/fake-summoner';
import { SocketProvider } from '../SocketContext';
import { useWorktreeActions, useWorktreeState, WorktreeProvider } from '../WorktreeContext';

function useWorktree() {
  return { ...useWorktreeState(), ...useWorktreeActions() };
}

/**
 * Minimal Socket+Worktree wrapper (intentionally *not* the full provider
 * stack — this file exercises the WorktreeContext contract in isolation).
 *
 * `priming` is a second FakeSummoner sharing the same server, used for
 * out-of-band state seeding and for driving real broadcasts through the
 * server that the hook-under-test's socket should pick up.
 */
function makeEnv() {
  const server = createFakeServer();
  const priming = new FakeSummoner(server);
  function Wrapper({ children }: { children: ReactNode }) {
    const ref = useRef<FakeSummoner | null>(null);
    if (!ref.current) ref.current = new FakeSummoner(server);
    return (
      <SocketProvider socket={ref.current.socket}>
        <WorktreeProvider>{children}</WorktreeProvider>
      </SocketProvider>
    );
  }
  return { Wrapper, priming };
}

describe('WorktreeContext', () => {
  it('useWorktreeState throws when used outside provider', () => {
    expect(() => renderHook(() => useWorktreeState())).toThrow(
      /useWorktreeState must be used within WorktreeProvider/,
    );
  });

  it('state exposes only domain data (listing) — no dialog UI flags', () => {
    const { Wrapper } = makeEnv();
    const { result } = renderHook(() => useWorktreeState(), { wrapper: Wrapper });
    expect(Object.keys(result.current).sort()).toEqual(['listing']);
  });

  it('useWorktree returns an actions object with create/list/remove', () => {
    const { Wrapper } = makeEnv();
    const { result } = renderHook(() => useWorktree(), { wrapper: Wrapper });
    expect(typeof result.current.create).toBe('function');
    expect(typeof result.current.list).toBe('function');
    expect(typeof result.current.remove).toBe('function');
  });

  it('list() returns worktrees from the server and caches by cwd', async () => {
    const { Wrapper, priming } = makeEnv();
    priming.git()!.setProjectRoot('/repo');
    priming.git()!.addWorktree({
      name: 'seeded',
      path: '/repo/.claude/worktrees/seeded',
      branch: 'worktree-seeded',
    });
    const { result } = renderHook(() => useWorktree(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.list('/repo');
    });
    expect(
      (result.current.listing['/repo'] as WorktreeInfo[] | undefined)?.some(
        (w) => w.name === 'seeded',
      ),
    ).toBe(true);
  });

  it('remove() invalidates cached listing entry', async () => {
    const { Wrapper, priming } = makeEnv();
    priming.git()!.setProjectRoot('/repo');
    priming.git()!.addWorktree({
      name: 'doomed',
      path: '/repo/.claude/worktrees/doomed',
      branch: 'worktree-doomed',
    });
    const { result } = renderHook(() => useWorktree(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.list('/repo');
    });
    expect(
      (result.current.listing['/repo'] as WorktreeInfo[] | undefined)?.some(
        (w) => w.name === 'doomed',
      ),
    ).toBe(true);

    await act(async () => {
      await result.current.remove('/repo', 'doomed');
    });
    expect(
      (result.current.listing['/repo'] as WorktreeInfo[] | undefined)?.some(
        (w) => w.name === 'doomed',
      ),
    ).toBe(false);
  });

  describe('broadcast subscriptions (Phase 4)', () => {
    it('worktree:added broadcast patches cache when project has been fetched', async () => {
      const { Wrapper, priming } = makeEnv();
      priming.git()!.setProjectRoot('/repo');
      const { result } = renderHook(() => useWorktree(), { wrapper: Wrapper });
      // Prime cache by fetching
      await act(async () => {
        await result.current.list('/repo');
      });
      expect(result.current.listing['/repo']).toEqual([]);

      // Simulate another tab creating a worktree — real server action →
      // real broadcastAll reaches our provider's socket.
      await act(async () => {
        await priming.claude().initialize({ launch: { cwd: '/repo' } });
        await priming.claude().send('worktree:create', {
          cwd: '/repo',
          name: 'from-other-tab',
        });
      });

      expect(
        (result.current.listing['/repo'] as WorktreeInfo[] | undefined)?.some(
          (w) => w.name === 'from-other-tab',
        ),
      ).toBe(true);
    });

    it('worktree:removed broadcast patches cache', async () => {
      const { Wrapper, priming } = makeEnv();
      priming.git()!.setProjectRoot('/repo');
      priming.git()!.addWorktree({
        name: 'to-remove',
        path: '/repo/.claude/worktrees/to-remove',
        branch: 'worktree-to-remove',
      });
      const { result } = renderHook(() => useWorktree(), { wrapper: Wrapper });
      await act(async () => {
        await result.current.list('/repo');
      });

      await act(async () => {
        await priming.claude().initialize({ launch: { cwd: '/repo' } });
        await priming.claude().send('worktree:delete', { cwd: '/repo', name: 'to-remove' });
      });

      expect(
        (result.current.listing['/repo'] as WorktreeInfo[] | undefined)?.some(
          (w) => w.name === 'to-remove',
        ),
      ).toBe(false);
    });

    it('worktree:added broadcast for not-yet-fetched project is ignored', async () => {
      const { Wrapper, priming } = makeEnv();
      priming.git()!.setProjectRoot('/repo');
      const { result } = renderHook(() => useWorktree(), { wrapper: Wrapper });

      await act(async () => {
        await priming.claude().initialize({ launch: { cwd: '/repo' } });
        await priming.claude().send('worktree:create', {
          cwd: '/repo',
          name: 'x',
        });
      });

      // /unfetched was never fetched → cache stays empty despite the broadcast
      expect(result.current.listing['/unfetched']).toBeUndefined();
    });
  });

  describe('worktree:branchChanged broadcast (Phase 10.13)', () => {
    it('updates the matching worktree entry branch in-place', async () => {
      const { Wrapper, priming } = makeEnv();
      priming.git()!.setProjectRoot('/repo');
      priming.git()!.addWorktree({
        name: 'wt1',
        path: '/repo/.claude/worktrees/wt1',
        branch: 'old-branch',
      });
      const { result } = renderHook(() => useWorktree(), { wrapper: Wrapper });
      await act(async () => {
        await result.current.list('/repo');
      });

      // Trigger branchChanged via real checkout on the priming summoner
      await act(async () => {
        await priming.claude().initialize({ launch: { cwd: '/repo' } });
        await priming.claude().send('worktree:checkout', {
          cwd: '/repo/.claude/worktrees/wt1',
          branch: 'new-branch',
        });
      });

      const entry = result.current.listing['/repo'] as WorktreeInfo[] | undefined;
      const wt = entry?.find((w) => w.path === '/repo/.claude/worktrees/wt1');
      expect(wt?.branch).toBe('new-branch');
    });
  });

  describe('listBranches (Phase 10.8b)', () => {
    it('git repo → returns branch array', async () => {
      const { Wrapper, priming } = makeEnv();
      priming.git()!.setProjectRoot('/repo');
      const { result } = renderHook(() => useWorktree(), { wrapper: Wrapper });
      let res: Awaited<ReturnType<typeof result.current.listBranches>> | undefined;
      await act(async () => {
        res = await result.current.listBranches('/repo');
      });
      expect(Array.isArray(res)).toBe(true);
      expect(res).toContain('main');
    });

    it('non-git → { error }', async () => {
      const { Wrapper, priming } = makeEnv();
      priming.git()!.setProjectRoot(null);
      const { result } = renderHook(() => useWorktree(), { wrapper: Wrapper });
      let res: Awaited<ReturnType<typeof result.current.listBranches>> | undefined;
      await act(async () => {
        res = await result.current.listBranches('/notes');
      });
      expect(res).toMatchObject({ error: 'not_a_repo' });
    });
  });

  describe('initRepo (Phase 4)', () => {
    it('initRepo on non-git path → marks listing with main worktree', async () => {
      const { Wrapper } = makeEnv();
      const { result } = renderHook(() => useWorktree(), { wrapper: Wrapper });

      // First prime cache to know /notes is not-a-repo
      await act(async () => {
        await result.current.list('/notes');
      });
      expect(result.current.listing['/notes']).toBe('not_a_repo');

      // Now init
      let res: Awaited<ReturnType<typeof result.current.initRepo>> | undefined;
      await act(async () => {
        res = await result.current.initRepo('/notes');
      });
      expect(res).toEqual({ ok: true, branch: 'main' });
      // After broadcast, listing patched from sentinel to array with main
      expect(
        (result.current.listing['/notes'] as WorktreeInfo[] | undefined)?.some(
          (w) => w.branch === 'main',
        ),
      ).toBe(true);
    });

    it('initRepo on already-a-repo path → error', async () => {
      const { Wrapper, priming } = makeEnv();
      priming.git()!.setProjectRoot('/repo');
      const { result } = renderHook(() => useWorktree(), { wrapper: Wrapper });

      let res: Awaited<ReturnType<typeof result.current.initRepo>> | undefined;
      await act(async () => {
        res = await result.current.initRepo('/repo');
      });
      expect(res).toMatchObject({ ok: false });
    });
  });
});
