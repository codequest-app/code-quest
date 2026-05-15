import type { AgentTransport } from '@code-quest/schemas';
import { REMOTE_METHODS } from '@code-quest/schemas';
import { FakeGitService } from '@code-quest/test-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GitHandler } from '../git-handler.ts';

function makeFakeRpc() {
  const handlers = new Map<string, (data: unknown) => Promise<unknown>>();
  const rpc: AgentTransport = {
    emit: vi.fn(),
    on: vi.fn(() => () => {}),
    onRequest: (event, handler) => {
      handlers.set(event, handler);
      return () => {};
    },
  };
  return {
    rpc,
    request: (method: string, params: unknown) => handlers.get(method)?.(params),
  };
}

describe('GitHandler', () => {
  let git: FakeGitService;

  beforeEach(() => {
    git = new FakeGitService();
  });

  it('status returns git status for cwd', async () => {
    git.setBranch('feature');
    git.setClean(false);
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.status, { cwd: '/repo' });

    expect(result).toMatchObject({ branch: 'feature', isClean: false });
  });

  it('checkout calls git.checkout and returns ok', async () => {
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.checkout, { cwd: '/repo', branch: 'main' });

    expect(result).toEqual({ ok: true });
  });

  it('log returns log entries respecting limit', async () => {
    git.setLogEntries([
      { hash: 'abc', message: 'first', author: 'Alice', date: '2024-01-01' },
      { hash: 'def', message: 'second', author: 'Bob', date: '2024-01-02' },
    ]);
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.log, { cwd: '/repo', limit: 1 });

    expect((result as { entries: unknown[] }).entries).toHaveLength(1);
  });

  it('diff returns diff string', async () => {
    git.setDiff('- old\n+ new');
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.diff, {
      cwd: '/repo',
      filePath: 'src/foo.ts',
      status: 'M',
    });

    expect(result).toEqual({ diff: '- old\n+ new' });
  });

  it('add stages files and returns ok', async () => {
    git.setChangedFiles([{ file: 'src/foo.ts', status: 'M' }]);
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.add, { cwd: '/repo', paths: ['src/foo.ts'] });

    expect(result).toEqual({ ok: true });
    expect(git.stagedCount).toBe(1);
  });

  it('commit returns ok with hash after staging', async () => {
    git.setChangedFiles([{ file: 'src/foo.ts', status: 'M' }]);
    await git.add('/repo', ['src/foo.ts']);
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.commit, {
      cwd: '/repo',
      message: 'feat: something',
    });

    expect(result).toMatchObject({ ok: true, hash: expect.stringContaining('fake-') });
  });

  it('push returns ok', async () => {
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.push, { cwd: '/repo' });

    expect(result).toEqual({ ok: true });
  });

  it('fetch returns ok', async () => {
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.fetch, { cwd: '/repo' });

    expect(result).toEqual({ ok: true });
  });

  it('pull returns ok with fastForwarded flag', async () => {
    git.setPullFastForwarded(true);
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.pull, { cwd: '/repo' });

    expect(result).toEqual({ ok: true, fastForwarded: true });
  });

  it('discardFile records the discarded file and returns ok', async () => {
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.discardFile, {
      cwd: '/repo',
      file: 'src/dirty.ts',
    });

    expect(result).toEqual({ ok: true });
    expect(git.discardedFiles).toContain('src/dirty.ts');
  });

  it('getRepoRoot returns the repo root', async () => {
    git.setRepoRoot('/repo');
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.getRepoRoot, { cwd: '/repo/src' });

    expect(result).toBe('/repo');
  });

  it('getProjectRoot returns the project root', async () => {
    git.setProjectRoot('/repo');
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.getProjectRoot, { cwd: '/repo/src' });

    expect(result).toBe('/repo');
  });

  it('initRepo initializes a new repo and returns branch', async () => {
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.initRepo, { cwd: '/new-project' });

    expect(result).toEqual({ branch: 'main' });
  });

  it('listBranches returns branches for a known repo', async () => {
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.listBranches, { repoRoot: '/repo' });

    expect(result).toContain('main');
  });

  it('createWorktree creates a worktree and returns its info', async () => {
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.createWorktree, {
      repoRoot: '/repo',
      opts: { newBranch: 'feature-x' },
    });

    expect(result).toMatchObject({ branch: 'feature-x' });
  });

  it('listWorktrees returns list of worktrees', async () => {
    git.addWorktree({
      name: 'feature-x',
      path: '/repo/.claude/worktrees/feature-x',
      branch: 'feature-x',
    });
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.listWorktrees, { repoRoot: '/repo' });

    expect(result).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'feature-x' })]),
    );
  });

  it('deleteWorktree removes the worktree and returns ok', async () => {
    git.addWorktree({
      name: 'to-delete',
      path: '/repo/.claude/worktrees/to-delete',
      branch: 'to-delete',
    });
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.deleteWorktree, {
      repoRoot: '/repo',
      name: 'to-delete',
    });

    expect(result).toEqual({ ok: true });
  });

  it('renameWorktree returns updated branch name', async () => {
    git.addWorktree({ name: 'wt1', path: '/repo/.claude/worktrees/wt1', branch: 'old-branch' });
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.renameWorktree, {
      worktreeCwd: '/repo/.claude/worktrees/wt1',
      newBranchName: 'new-branch',
    });

    expect(result).toEqual({ branch: 'new-branch' });
  });

  it('archiveWorktree archives the worktree and returns ok', async () => {
    git.addWorktree({
      name: 'to-archive',
      path: '/repo/.claude/worktrees/to-archive',
      branch: 'to-archive',
    });
    const { rpc, request } = makeFakeRpc();
    new GitHandler(git).attach(rpc);

    const result = await request(REMOTE_METHODS.git.archiveWorktree, {
      repoRoot: '/repo',
      name: 'to-archive',
      opts: {},
    });

    expect(result).toEqual({ ok: true });
  });
});
