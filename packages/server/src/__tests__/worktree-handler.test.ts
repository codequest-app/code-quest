/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */

import type {
  Ack,
  CreateWorktreeResponse,
  InitRepoResponse,
  ListBranchesResponse,
  WorktreeCheckoutResponse,
  WorktreeListResponse,
  WorktreeStatusResponse,
} from '@code-quest/shared';
import { segments as s } from '@code-quest/summoner/test';
import { createFakeSummoner } from '../test/index.ts';

type WorktreeDeleteResp = Ack;

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

  it('worktree:list returns not_a_repo error when cwd is not in a git repo', async () => {
    const { claude, git } = await setup();
    git.setProjectRoot(null);

    const result = await claude.send<WorktreeListResponse>('worktree:list', { cwd: '/tmp' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('not_a_repo');
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

  describe('broadcast events', () => {
    it('worktree:create success → broadcast worktree:added', async () => {
      const { claude } = await setup();
      const before = claude.events('worktree:added').length;
      await claude.send<CreateWorktreeResponse>('worktree:create', {
        cwd: '/repo',
        name: 'feat-b',
      });
      expect(claude.events('worktree:added').length).toBeGreaterThan(before);
    });

    it('worktree:delete success → broadcast worktree:removed', async () => {
      const { claude, git } = await setup();
      git.addWorktree({ name: 'gone', path: '/repo/.claude/worktrees/gone', branch: 'gone' });
      const before = claude.events('worktree:removed').length;
      await claude.send<Ack>('worktree:delete', { cwd: '/repo', name: 'gone' });
      expect(claude.events('worktree:removed').length).toBeGreaterThan(before);
    });

    it('worktree:initRepo success → broadcast worktree:added', async () => {
      const { claude, git } = await setup();
      git.setProjectRoot(null);
      const before = claude.events('worktree:added').length;
      await claude.send<InitRepoResponse>('worktree:initRepo', { cwd: '/notes2' });
      expect(claude.events('worktree:added').length).toBeGreaterThan(before);
    });

    it('worktree:create failure → no broadcast', async () => {
      const { claude, git } = await setup();
      git.setProjectRoot(null);
      const before = claude.events('worktree:added').length;
      await claude.send<CreateWorktreeResponse>('worktree:create', { cwd: '/tmp', name: 'x' });
      expect(claude.events('worktree:added').length).toBe(before);
    });
  });

  describe('worktree:initRepo', () => {
    it('non-git path → ok with branch=main, repo becomes listable', async () => {
      const { claude, git } = await setup();
      // Path /notes is NOT a registered repo in fake
      git.setProjectRoot(null); // simulate non-git via getProjectRoot

      const res = await claude.send<InitRepoResponse>('worktree:initRepo', { cwd: '/notes' });

      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data.branch).toBe('main');
      // After init, fake should have /notes registered
      git.setProjectRoot('/notes');
      const wts = await git.listWorktrees('/notes');
      expect(wts.some((w) => w.branch === 'main' || w.name === 'main')).toBe(true);
    });

    it('already a repo → error', async () => {
      const { claude } = await setup();
      // /repo is already initialized via fake's default seed
      const res = await claude.send<InitRepoResponse>('worktree:initRepo', { cwd: '/repo' });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toMatch(/already/i);
    });
  });

  describe('worktree:listBranches', () => {
    it('git repo → ok with array', async () => {
      const { claude } = await setup();
      const res = await claude.send<ListBranchesResponse>('worktree:listBranches', {
        cwd: '/repo',
      });
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data.branches).toContain('main');
    });

    it('non-git → not_a_repo error', async () => {
      const { claude, git } = await setup();
      git.setProjectRoot(null);
      const res = await claude.send<ListBranchesResponse>('worktree:listBranches', {
        cwd: '/tmp',
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toBe('not_a_repo');
    });
  });

  describe('worktree:checkout', () => {
    it('git cwd → ok + branch + broadcast worktree:branchChanged', async () => {
      const { claude, git } = await setup();
      const before = claude.events('worktree:branchChanged').length;
      const res = await claude.send<WorktreeCheckoutResponse>('worktree:checkout', {
        cwd: '/repo',
        branch: 'feat/x',
      });
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.data.branch).toBe('feat/x');
      expect(claude.events('worktree:branchChanged').length).toBeGreaterThan(before);
      void git;
    });

    it('non-git cwd → error, no broadcast', async () => {
      const { claude, git } = await setup();
      git.setProjectRoot(null);
      const before = claude.events('worktree:branchChanged').length;
      const res = await claude.send<WorktreeCheckoutResponse>('worktree:checkout', {
        cwd: '/tmp',
        branch: 'x',
      });
      expect(res.ok).toBe(false);
      expect(claude.events('worktree:branchChanged').length).toBe(before);
    });
  });

  describe('worktree:status', () => {
    it('git cwd → ok with branch + changedFilesCount', async () => {
      const { claude, git } = await setup();
      git.setBranch('main');
      git.setChangedFiles([
        { status: 'M', file: 'a.ts' },
        { status: 'A', file: 'b.ts' },
      ]);
      const res = await claude.send<WorktreeStatusResponse>('worktree:status', {
        cwd: '/repo',
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.data.branch).toBe('main');
        expect(res.data.changedFilesCount).toBe(2);
      }
    });

    it('non-git cwd → error', async () => {
      const { claude, git } = await setup();
      git.setProjectRoot(null);
      const res = await claude.send<WorktreeStatusResponse>('worktree:status', {
        cwd: '/tmp',
      });
      expect(res.ok).toBe(false);
    });
  });

  describe('worktree:create with new options', () => {
    it('existingBranch → creates worktree with that branch', async () => {
      const { claude } = await setup();
      const res = await claude.send<CreateWorktreeResponse>('worktree:create', {
        cwd: '/repo',
        existingBranch: 'main',
      });
      expect(res.ok).toBe(true);
    });

    it('newBranch + baseBranch → passes through to gitService', async () => {
      const { claude } = await setup();
      const res = await claude.send<CreateWorktreeResponse>('worktree:create', {
        cwd: '/repo',
        newBranch: 'feat/x',
        baseBranch: 'main',
      });
      expect(res.ok).toBe(true);
    });
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
