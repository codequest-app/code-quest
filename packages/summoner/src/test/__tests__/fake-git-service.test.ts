import { describe, expect, it } from 'vitest';
import { FakeGitService } from '../fake-git-service.ts';

describe('FakeGitService', () => {
  describe('status', () => {
    it('returns default branch and clean state', async () => {
      const git = new FakeGitService();
      const result = await git.status('/repo');
      expect(result).toEqual({ branch: 'main', isClean: true, changedFiles: [] });
    });

    it('returns configured state', async () => {
      const git = new FakeGitService();
      git.setBranch('feature-x');
      git.setClean(false);
      git.setChangedFiles([{ status: 'M', file: 'index.ts' }]);

      const result = await git.status('/repo');
      expect(result.branch).toBe('feature-x');
      expect(result.isClean).toBe(false);
      expect(result.changedFiles).toHaveLength(1);
    });
  });

  describe('checkout', () => {
    it('succeeds by default', async () => {
      const git = new FakeGitService();
      await expect(git.checkout('/repo', 'feature-x')).resolves.toBeUndefined();
    });

    it('throws when error configured', async () => {
      const git = new FakeGitService();
      git.setCheckoutError(new Error('no such branch'));
      await expect(git.checkout('/repo', 'bad')).rejects.toThrow('no such branch');
    });
  });

  describe('log', () => {
    it('returns configured entries', async () => {
      const git = new FakeGitService();
      git.setLogEntries([
        { hash: 'abc', message: 'feat', author: 'A', date: '2024-01-01' },
        { hash: 'def', message: 'fix', author: 'B', date: '2024-01-02' },
      ]);
      const result = await git.log('/repo');
      expect(result.entries).toHaveLength(2);
    });

    it('respects limit', async () => {
      const git = new FakeGitService();
      git.setLogEntries([
        { hash: 'a', message: 'a', author: 'A', date: '1' },
        { hash: 'b', message: 'b', author: 'B', date: '2' },
        { hash: 'c', message: 'c', author: 'C', date: '3' },
      ]);
      const result = await git.log('/repo', 2);
      expect(result.entries).toHaveLength(2);
    });
  });

  describe('diff', () => {
    it('returns configured diff', async () => {
      const git = new FakeGitService();
      git.setDiff('+added');
      const result = await git.diff('/repo');
      expect(result.diff).toBe('+added');
    });
  });

  describe('worktree', () => {
    it('getRepoRoot returns configured root', async () => {
      const git = new FakeGitService();
      expect(await git.getRepoRoot('/repo/src')).toBe('/repo');
    });

    it('getRepoRoot returns null when not a repo', async () => {
      const git = new FakeGitService();
      git.setRepoRoot(null);
      expect(await git.getRepoRoot('/tmp')).toBeNull();
    });

    it('createWorktree adds and returns worktree', async () => {
      const git = new FakeGitService();
      const wt = await git.createWorktree('/repo', { name: 'my-task' });
      expect(wt.name).toBe('my-task');
      expect(wt.branch).toBe('worktree-my-task');
      expect(await git.listWorktrees('/repo')).toHaveLength(1);
    });

    it('listWorktrees returns added worktrees', async () => {
      const git = new FakeGitService();
      git.addWorktree({
        name: 'wt-1',
        path: '/repo/.claude/worktrees/wt-1',
        branch: 'worktree-wt-1',
      });
      expect(await git.listWorktrees('/repo')).toHaveLength(1);
    });

    it('deleteWorktree removes worktree', async () => {
      const git = new FakeGitService();
      await git.createWorktree('/repo', { name: 'to-delete' });
      await git.deleteWorktree('/repo', 'to-delete');
      expect(await git.listWorktrees('/repo')).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('clears all state', async () => {
      const git = new FakeGitService();
      git.setBranch('other');
      git.setDiff('+x');
      git.addWorktree({ name: 'wt', path: '/p', branch: 'b' });
      git.reset();

      expect((await git.status('/r')).branch).toBe('main');
      expect((await git.diff('/r')).diff).toBe('');
      // After reset, only the default-seeded /repo is treated as a git repo.
      expect(await git.listWorktrees('/repo')).toHaveLength(0);
    });
  });
});

// ── Contract tests (run the same suite against the real GitService too) ──
import {
  type ContractSetup,
  gitServiceContract,
} from '../../git/__tests__/git-service.contract.ts';

let pathCounter = 0;
const uniquePath = (prefix: string): string => `${prefix}-${++pathCounter}`;

gitServiceContract('FakeGitService', async (): Promise<ContractSetup> => {
  const service = new FakeGitService();
  return {
    service,
    cwd: uniquePath('/non-git'),
    makeExistingRepo: async () => {
      const path = uniquePath('/repo');
      await service.initRepo(path);
      return path;
    },
  };
});
