import { segments as s } from '@code-quest/summoner/test';
import { createFakeSummoner } from '../test/index.ts';

async function setup(sessionId = 'cli-sess') {
  const summoner = createFakeSummoner();
  const claude = summoner.claude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId, git: summoner.git()! };
}

describe('worktree handler', () => {
  it('worktree:list returns worktrees from channel cwd', async () => {
    const { claude, channelId, git } = await setup();
    git.addWorktree({
      name: 'my-feature',
      path: '/repo/.claude/worktrees/my-feature',
      branch: 'worktree-my-feature',
    });

    const result = await claude.send<{ worktrees: Array<{ name: string; path: string }> }>(
      'worktree:list',
      { channelId },
    );

    expect(result.worktrees).toHaveLength(1);
    expect(result.worktrees[0]).toMatchObject({
      name: 'my-feature',
      path: '/repo/.claude/worktrees/my-feature',
    });
  });

  it('worktree:list returns empty when not in git repo', async () => {
    const { claude, channelId, git } = await setup();
    git.setRepoRoot(null);

    const result = await claude.send<{ worktrees: unknown[] }>('worktree:list', { channelId });

    expect(result.worktrees).toEqual([]);
  });

  it('worktree:delete returns success', async () => {
    const { claude, channelId, git } = await setup();
    git.addWorktree({
      name: 'my-feature',
      path: '/repo/.claude/worktrees/my-feature',
      branch: 'worktree-my-feature',
    });

    const result = await claude.send<{ success: boolean }>('worktree:delete', {
      channelId,
      name: 'my-feature',
    });

    expect(result.success).toBe(true);
    expect(await git.listWorktrees('/repo')).toHaveLength(0);
  });

  it('worktree:delete returns error when name is missing', async () => {
    const { claude, channelId } = await setup();

    const result = await claude.send<{ success: boolean; error?: string }>('worktree:delete', {
      channelId,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('name is required');
  });
});
