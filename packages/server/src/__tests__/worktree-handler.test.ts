import { segments as s } from '@code-quest/summoner/test';
import { createFakeGit } from '../test/fake-git.ts';
import { createFakeSummoner } from '../test/index.ts';

async function setup(sessionId = 'cli-sess') {
  const claude = createFakeSummoner().claude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId };
}

describe('worktree handler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('worktree:list returns worktrees from channel cwd', async () => {
    const fakeGit = createFakeGit({
      revparseResults: { '--show-toplevel': '/repo' },
      rawResults: {
        'worktree list --porcelain':
          'worktree /repo\nbranch refs/heads/main\n\nworktree /repo/.claude/worktrees/my-feature\nbranch refs/heads/worktree-my-feature\n\n',
      },
    });

    const { claude, channelId } = await setup();

    const result = await claude.send<{ worktrees: Array<{ name: string; path: string }> }>(
      'worktree:list',
      { channelId },
    );

    expect(result.worktrees).toHaveLength(1);
    expect(result.worktrees[0]).toMatchObject({
      name: 'my-feature',
      path: '/repo/.claude/worktrees/my-feature',
    });

    fakeGit.restore();
  });

  it('worktree:list returns empty when not in git repo', async () => {
    const fakeGit = createFakeGit({
      revparseResults: {},
    });
    // revparse will return '' → getRepoRoot returns null
    (fakeGit.instance.revparse as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('not a git repo'),
    );

    const { claude, channelId } = await setup();

    const result = await claude.send<{ worktrees: unknown[] }>('worktree:list', { channelId });

    expect(result.worktrees).toEqual([]);

    fakeGit.restore();
  });

  it('worktree:delete returns success', async () => {
    const fakeGit = createFakeGit({
      revparseResults: { '--show-toplevel': '/repo' },
    });

    const { claude, channelId } = await setup();

    const result = await claude.send<{ success: boolean }>('worktree:delete', {
      channelId,
      name: 'my-feature',
    });

    expect(result.success).toBe(true);
    // rawGit called with worktree remove + branch -D
    expect(fakeGit.rawCalls).toContainEqual(expect.arrayContaining(['worktree', 'remove']));

    fakeGit.restore();
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
