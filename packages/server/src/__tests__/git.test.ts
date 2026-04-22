/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */

import type { Ack } from '@code-quest/shared';
import { segments as s } from '@code-quest/summoner/test';
import { createFakeSummoner } from '../test/index.ts';

type GitEmptyResp = Ack;

async function setup(sessionId = 'cli-sess') {
  const summoner = createFakeSummoner();
  const claude = summoner.claude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId, git: summoner.git()! };
}

describe('ChatHandler > git', () => {
  it('git:update_skipped_branch records entry and returns success', async () => {
    const { claude, channelId } = await setup();

    const result = await claude.send<GitEmptyResp>('git:update_skipped_branch', {
      channelId,
      branch: 'feature/x',
      failed: true,
    });

    expect(result.ok).toBe(true);
  });

  describe('git:log and git:diff', () => {
    it('git:log parses formatted output into entries', async () => {
      const { claude, channelId, git } = await setup();
      git.setLogEntries([
        {
          hash: 'abc123',
          message: 'feat: add login',
          author: 'Alice',
          date: '2024-01-01 10:00:00 +0000',
        },
        { hash: 'def456', message: 'fix: typo', author: 'Bob', date: '2024-01-02 11:00:00 +0000' },
      ]);

      const result = await claude.send<{
        entries: Array<{ hash: string; message: string; author: string; date: string }>;
      }>('git:log', { channelId, limit: 5 });

      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({
        hash: 'abc123',
        message: 'feat: add login',
        author: 'Alice',
        date: '2024-01-01 10:00:00 +0000',
      });
    });

    it('git:log returns empty entries on error', async () => {
      const { claude, channelId, git } = await setup();
      // FakeGitService default: empty entries
      git.setLogEntries([]);

      const result = await claude.send<{ entries: unknown[] }>('git:log', { channelId });

      expect(result.entries).toEqual([]);
    });

    it('git:diff returns diff output', async () => {
      const { claude, channelId, git } = await setup();
      git.setDiff('+added\n-removed\n');

      const result = await claude.send<{ diff: string }>('git:diff', { channelId });

      expect(result.diff).toBe('+added\n-removed\n');
    });

    it('git:diff returns empty string on error', async () => {
      const { claude, channelId } = await setup();
      // FakeGitService default: empty diff

      const result = await claude.send<{ diff: string }>('git:diff', { channelId });

      expect(result.diff).toBe('');
    });
  });

  describe('git:checkout', () => {
    it('should succeed when checkout works', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<GitEmptyResp>('git:checkout', {
        channelId,
        branch: 'feature/test',
      });

      expect(result.ok).toBe(true);
    });

    it('should return error when checkout fails', async () => {
      const { claude, channelId, git } = await setup();
      git.setCheckoutError(new Error('fatal: no such branch'));

      const result = await claude.send<GitEmptyResp>('git:checkout', {
        channelId,
        branch: 'nonexistent',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBeDefined();
    });
  });
});
