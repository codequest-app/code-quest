/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */
import { segments as s } from '@code-quest/summoner/test';
import * as execGitModule from '../socket/handlers/exec-git.ts';
import { createFakeClaude } from '../test/index.ts';

async function setup(sessionId = 'cli-sess') {
  const claude = createFakeClaude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId };
}

describe('ChatHandler > git', () => {
  it('git:update_skipped_branch records entry and returns success', async () => {
    const { claude, channelId } = await setup();

    const result = await claude.send<{ success: boolean }>('git:update_skipped_branch', {
      channelId,
      branch: 'feature/x',
      failed: true,
    });

    expect(result.success).toBe(true);
  });

  it('git:exec runs a command and returns output', async () => {
    const claude = createFakeClaude();

    const result = await claude.send<{ exitCode: number; stdout: string; stderr: string }>(
      'git:exec',
      {
        command: 'echo',
        args: ['hello'],
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('hello');
  });

  it('git:exec returns error for non-existent command', async () => {
    const claude = createFakeClaude();

    const result = await claude.send<{ exitCode: number; stdout: string; stderr: string }>(
      'git:exec',
      {
        command: 'nonexistent_cmd_xyz_12345',
      },
    );

    expect(result.exitCode).not.toBe(0);
  });

  describe('git:log and git:diff', () => {
    let execGitSpy: any;

    beforeEach(() => {
      execGitSpy = vi.spyOn(execGitModule, 'execGit');
    });

    afterEach(() => {
      execGitSpy.mockRestore();
    });

    it('git:log parses formatted output into entries', async () => {
      execGitSpy.mockResolvedValue(
        'abc123|feat: add login|Alice|2024-01-01 10:00:00 +0000\ndef456|fix: typo|Bob|2024-01-02 11:00:00 +0000\n',
      );

      const { claude } = await setup();

      const result = await claude.send<{
        entries: Array<{ hash: string; message: string; author: string; date: string }>;
      }>('git:log', { limit: 5 });

      expect(execGitSpy).toHaveBeenCalledWith(['log', '--format=%H|%s|%an|%ai', '-n', '5']);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({
        hash: 'abc123',
        message: 'feat: add login',
        author: 'Alice',
        date: '2024-01-01 10:00:00 +0000',
      });
    });

    it('git:log returns empty entries on error', async () => {
      execGitSpy.mockRejectedValue(new Error('not a git repo'));

      const { claude } = await setup();

      const result = await claude.send<{ entries: unknown[] }>('git:log', {});

      expect(result.entries).toEqual([]);
    });

    it('git:diff returns diff output', async () => {
      execGitSpy.mockResolvedValue('+added\n-removed\n');

      const { claude } = await setup();

      const result = await claude.send<{ diff: string }>('git:diff');

      expect(execGitSpy).toHaveBeenCalledWith(['diff']);
      expect(result.diff).toBe('+added\n-removed\n');
    });

    it('git:diff returns empty string on error', async () => {
      execGitSpy.mockRejectedValue(new Error('fail'));

      const { claude } = await setup();

      const result = await claude.send<{ diff: string }>('git:diff');

      expect(result.diff).toBe('');
    });
  });

  describe('git:checkout multi-strategy', () => {
    let execGitSpy: any;

    beforeEach(() => {
      execGitSpy = vi.spyOn(execGitModule, 'execGit');
    });

    afterEach(() => {
      execGitSpy.mockRestore();
    });

    it('should succeed on local checkout (strategy 1)', async () => {
      execGitSpy.mockResolvedValue('');

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('git:checkout', {
        branch: 'feature/test',
      });

      expect(result.success).toBe(true);
      expect(execGitSpy).toHaveBeenCalledTimes(1);
      expect(execGitSpy).toHaveBeenCalledWith(['checkout', 'feature/test']);
    });

    it('should try fetch+checkout when local fails (strategy 2)', async () => {
      execGitSpy
        .mockRejectedValueOnce(new Error('pathspec did not match'))
        .mockResolvedValueOnce('')
        .mockResolvedValueOnce('');

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('git:checkout', {
        branch: 'feature/remote',
      });

      expect(result.success).toBe(true);
      expect(execGitSpy).toHaveBeenCalledTimes(3);
      expect(execGitSpy).toHaveBeenNthCalledWith(1, ['checkout', 'feature/remote']);
      expect(execGitSpy).toHaveBeenNthCalledWith(2, ['fetch', 'origin']);
      expect(execGitSpy).toHaveBeenNthCalledWith(3, ['checkout', 'feature/remote']);
    });

    it('should try --track when fetch+checkout fails (strategy 3)', async () => {
      execGitSpy
        .mockRejectedValueOnce(new Error('pathspec did not match'))
        .mockResolvedValueOnce('')
        .mockRejectedValueOnce(new Error('pathspec did not match'))
        .mockResolvedValueOnce('');

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('git:checkout', {
        branch: 'feature/track',
      });

      expect(result.success).toBe(true);
      expect(execGitSpy).toHaveBeenCalledTimes(4);
      expect(execGitSpy).toHaveBeenNthCalledWith(1, ['checkout', 'feature/track']);
      expect(execGitSpy).toHaveBeenNthCalledWith(2, ['fetch', 'origin']);
      expect(execGitSpy).toHaveBeenNthCalledWith(3, ['checkout', 'feature/track']);
      expect(execGitSpy).toHaveBeenNthCalledWith(4, [
        'checkout',
        '--track',
        'origin/feature/track',
      ]);
    });

    it('should return error when all strategies fail', async () => {
      execGitSpy
        .mockRejectedValueOnce(new Error('pathspec did not match'))
        .mockResolvedValueOnce('')
        .mockRejectedValueOnce(new Error('pathspec did not match'))
        .mockRejectedValueOnce(new Error('fatal: no such branch'));

      const { claude } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('git:checkout', {
        branch: 'nonexistent',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
