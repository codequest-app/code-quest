/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */
import { segments as s } from '@code-quest/summoner/test';
import { createFakeGit } from '../test/fake-git.ts';
import { createFakeClaude } from '../test/index.ts';

async function setup(sessionId = 'cli-sess') {
  const claude = createFakeClaude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId };
}

describe('ChatHandler > git', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    const { claude, channelId } = await setup();

    const result = await claude.send<{ exitCode: number; stdout: string; stderr: string }>(
      'git:exec',
      {
        channelId,
        command: 'echo',
        args: ['hello'],
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('hello');
  });

  it('git:exec returns error for non-existent command', async () => {
    const { claude, channelId } = await setup();

    const result = await claude.send<{ exitCode: number; stdout: string; stderr: string }>(
      'git:exec',
      {
        channelId,
        command: 'nonexistent_cmd_xyz_12345',
      },
    );

    expect(result.exitCode).not.toBe(0);
  });

  describe('git:log and git:diff', () => {
    it('git:log parses formatted output into entries', async () => {
      const fakeGit = createFakeGit({
        log: {
          all: [
            {
              hash: 'abc123',
              message: 'feat: add login',
              author_name: 'Alice',
              date: '2024-01-01 10:00:00 +0000',
            },
            {
              hash: 'def456',
              message: 'fix: typo',
              author_name: 'Bob',
              date: '2024-01-02 11:00:00 +0000',
            },
          ],
        },
      });

      const { claude, channelId } = await setup();

      const result = await claude.send<{
        entries: Array<{ hash: string; message: string; author: string; date: string }>;
      }>('git:log', { channelId, limit: 5 });

      expect(fakeGit.instance.log).toHaveBeenCalledWith({ maxCount: 5 });
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({
        hash: 'abc123',
        message: 'feat: add login',
        author: 'Alice',
        date: '2024-01-01 10:00:00 +0000',
      });

      fakeGit.restore();
    });

    it('git:log returns empty entries on error', async () => {
      const fakeGit = createFakeGit();
      (fakeGit.instance.log as any).mockRejectedValue(new Error('not a git repo'));

      const { claude, channelId } = await setup();

      const result = await claude.send<{ entries: unknown[] }>('git:log', { channelId });

      expect(result.entries).toEqual([]);

      fakeGit.restore();
    });

    it('git:diff returns diff output', async () => {
      const fakeGit = createFakeGit({ diff: '+added\n-removed\n' });

      const { claude, channelId } = await setup();

      const result = await claude.send<{ diff: string }>('git:diff', { channelId });

      expect(fakeGit.instance.diff).toHaveBeenCalled();
      expect(result.diff).toBe('+added\n-removed\n');

      fakeGit.restore();
    });

    it('git:diff returns empty string on error', async () => {
      const fakeGit = createFakeGit();
      (fakeGit.instance.diff as any).mockRejectedValue(new Error('fail'));

      const { claude, channelId } = await setup();

      const result = await claude.send<{ diff: string }>('git:diff', { channelId });

      expect(result.diff).toBe('');

      fakeGit.restore();
    });
  });

  describe('git:checkout multi-strategy', () => {
    it('should succeed on local checkout (strategy 1)', async () => {
      const fakeGit = createFakeGit();

      const { claude, channelId } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('git:checkout', {
        channelId,
        branch: 'feature/test',
      });

      expect(result.success).toBe(true);
      expect(fakeGit.instance.checkout).toHaveBeenCalledWith('feature/test');

      fakeGit.restore();
    });

    it('should try fetch+checkout when local fails (strategy 2)', async () => {
      const fakeGit = createFakeGit();
      fakeGit.failCheckoutTimes(1);

      const { claude, channelId } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('git:checkout', {
        channelId,
        branch: 'feature/remote',
      });

      expect(result.success).toBe(true);
      expect(fakeGit.instance.fetch).toHaveBeenCalledWith('origin');
      expect(fakeGit.checkoutCalls).toHaveLength(2);

      fakeGit.restore();
    });

    it('should try --track when fetch+checkout fails (strategy 3)', async () => {
      const fakeGit = createFakeGit({ fetchError: new Error('fetch failed') });
      fakeGit.failCheckoutTimes(1);

      const { claude, channelId } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('git:checkout', {
        channelId,
        branch: 'feature/track',
      });

      expect(result.success).toBe(true);
      expect(fakeGit.checkoutCalls).toContainEqual(['-t', 'origin/feature/track']);

      fakeGit.restore();
    });

    it('should return error when all strategies fail', async () => {
      const fakeGit = createFakeGit({
        checkoutError: new Error('fatal: no such branch'),
        fetchError: new Error('fetch failed'),
      });

      const { claude, channelId } = await setup();

      const result = await claude.send<{ success: boolean; error?: string }>('git:checkout', {
        channelId,
        branch: 'nonexistent',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      fakeGit.restore();
    });
  });
});
