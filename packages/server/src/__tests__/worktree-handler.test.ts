/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */

import type { CreateWorktreeResponse, RpcResult, WorktreeListResponse } from '@code-quest/shared';
import { segments as s } from '@code-quest/summoner/test';
import { createFakeSummoner } from '../test/index.ts';

type WorktreeDeleteResp = RpcResult<Record<string, never>>;

async function setup(sessionId = 'cli-sess') {
  const summoner = createFakeSummoner();
  summoner.git()!.setProjectRoot('/repo');
  const claude = summoner.claude();
  const channelId = await claude.initialize({ launch: { cwd: '/repo' } }, s.init(sessionId));
  return { claude, channelId, git: summoner.git()! };
}

describe('worktree handler', () => {
  it('worktree:list returns worktrees (RpcResult ok) from cwd', async () => {
    const { claude, git } = await setup();
    git.addWorktree({
      name: 'my-feature',
      path: '/repo/.claude/worktrees/my-feature',
      branch: 'worktree-my-feature',
    });

    const result = await claude.send<WorktreeListResponse>('worktree:list', { cwd: '/repo' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.worktrees).toHaveLength(1);
      expect(result.data.worktrees[0]).toMatchObject({ name: 'my-feature' });
    }
  });

  it('worktree:list returns empty list when cwd is not in a git repo', async () => {
    const { claude, git } = await setup();
    git.setProjectRoot(null);

    const result = await claude.send<WorktreeListResponse>('worktree:list', { cwd: '/tmp' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.worktrees).toEqual([]);
  });

  it('worktree:delete returns success', async () => {
    const { claude, git } = await setup();
    git.addWorktree({
      name: 'my-feature',
      path: '/repo/.claude/worktrees/my-feature',
      branch: 'worktree-my-feature',
    });

    const result = await claude.send<WorktreeDeleteResp>('worktree:delete', {
      cwd: '/repo',
      name: 'my-feature',
    });

    expect(result.ok).toBe(true);
    expect(await git.listWorktrees('/repo')).toHaveLength(0);
  });

  it('worktree:delete returns error when cwd/name invalid', async () => {
    const { claude } = await setup();

    const result = await claude.send<WorktreeDeleteResp>('worktree:delete', { cwd: '/repo' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/name|required|invalid/i);
  });

  it('worktree:create returns RpcResult with channelId + worktreePath', async () => {
    const { claude } = await setup();

    const result = await claude.send<CreateWorktreeResponse>('worktree:create', {
      cwd: '/repo',
      name: 'feat-a',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.channelId).toBeTruthy();
      expect(result.data.worktreePath).toBe('/repo/.claude/worktrees/feat-a');
    }
  });

  it('worktree:create returns error when not in git repo', async () => {
    const { claude, git } = await setup();
    git.setProjectRoot(null);

    const result = await claude.send<CreateWorktreeResponse>('worktree:create', {
      cwd: '/tmp',
      name: 'feat-x',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Not inside a git repository');
  });
});
