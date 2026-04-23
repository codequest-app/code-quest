import { mkdir } from 'node:fs/promises';
import { isAbsolute, join, resolve, sep } from 'node:path';
import {
  errMsg,
  type GitDiffResult,
  type GitLogResult,
  type GitStatusResult,
  validateWorktreeName as validateWorktreeNameShared,
  type WorktreeInfo,
} from '@code-quest/shared';
import { GitResponseError, type SimpleGit, simpleGit } from 'simple-git';
import { AlreadyRepoError, NotARepoError } from './errors.ts';
import type { CreateWorktreeOptions, GitService } from './types.ts';

const WORKTREE_PATH_RE = /[/\\]\.claude[/\\]worktrees[/\\]([^/\\]+)$/;

/** Throwing wrapper around the shared validator — used at git boundaries
 *  where an invalid name must abort the operation. */
export function validateWorktreeName(name: string): void {
  const err = validateWorktreeNameShared(name);
  if (err) throw new Error(`Invalid worktree name: ${err}`);
}

/** Detect if a path is inside a managed worktree. */
export function detectWorktree(path: string): WorktreeInfo | null {
  const match = WORKTREE_PATH_RE.exec(path);
  if (!match) return null;
  return { name: match[1], path };
}

function parseWorktreeList(stdout: string): WorktreeInfo[] {
  const worktrees: WorktreeInfo[] = [];
  let current: { worktreePath?: string; branch?: string } = {};

  const flush = () => {
    if (current.worktreePath) {
      const match = current.worktreePath.match(WORKTREE_PATH_RE);
      if (match) {
        worktrees.push({ name: match[1], path: current.worktreePath, branch: current.branch });
      } else {
        // Main worktree (or any non-managed worktree): name from branch when
        // available, fall back to last path segment.
        const fallback = current.worktreePath.split(/[/\\]/).filter(Boolean).pop() ?? '';
        const name = current.branch ?? fallback;
        worktrees.push({ name, path: current.worktreePath, branch: current.branch });
      }
    }
    current = {};
  };

  for (const line of stdout.split('\n')) {
    if (line.startsWith('worktree ')) {
      current.worktreePath = line.slice('worktree '.length);
    } else if (line.startsWith('branch ')) {
      current.branch = line.slice('branch '.length).replace('refs/heads/', '');
    } else if (line === '') {
      flush();
    }
  }
  flush(); // Handle trimmed output (no trailing newline)

  return worktrees;
}

export class LocalGitService implements GitService {
  readonly capabilities = { worktree: true } as const;

  // ── Git operations ──

  async status(cwd: string): Promise<GitStatusResult> {
    const git = this.createGit(cwd);
    const s = await git.status();
    return {
      branch: s.current ?? 'unknown',
      isClean: s.isClean(),
      changedFiles: s.files.map((f) => ({
        status: `${f.index}${f.working_dir}`.trim(),
        file: f.path,
      })),
    };
  }

  async checkout(cwd: string, branch: string): Promise<void> {
    const git = this.createGit(cwd);
    await this.checkoutWithFallback(git, branch);
  }

  async log(cwd: string, limit?: number): Promise<GitLogResult> {
    const git = this.createGit(cwd);
    const result = await git.log({ maxCount: limit ?? 20 });
    return {
      entries: result.all.map((e) => ({
        hash: e.hash,
        message: e.message,
        author: e.author_name,
        date: e.date,
      })),
    };
  }

  async diff(cwd: string): Promise<GitDiffResult> {
    const git = this.createGit(cwd);
    return { diff: await git.diff() };
  }

  // ── Worktree operations ──

  async getRepoRoot(cwd: string): Promise<string | null> {
    try {
      return (await this.createGit(cwd).revparse(['--show-toplevel'])).trim();
    } catch (err) {
      console.debug('[GitService] getRepoRoot failed:', errMsg(err));
      return null;
    }
  }

  async getProjectRoot(cwd: string): Promise<string | null> {
    try {
      const git = this.createGit(cwd);
      const commonDir = (await git.revparse(['--git-common-dir'])).trim();
      // commonDir is either an absolute path or a path relative to cwd.
      const absolute = isAbsolute(commonDir) ? commonDir : resolve(cwd, commonDir);
      // Strip the trailing `.git` (main repo) or `.git/worktrees/<name>` (linked worktree).
      const dotGitIdx = absolute.lastIndexOf(`${sep}.git`);
      if (dotGitIdx === -1) return absolute;
      return absolute.slice(0, dotGitIdx);
    } catch (err) {
      console.debug('[GitService] getProjectRoot failed:', errMsg(err));
      return null;
    }
  }

  async initRepo(cwd: string): Promise<{ branch: string }> {
    if ((await this.getRepoRoot(cwd)) !== null) throw new AlreadyRepoError(cwd);
    const git = this.createGit(cwd);
    // -b main: ensure default branch is "main" regardless of git's init.defaultBranch.
    // -c user.*: avoid commit failure when user has no global git identity configured.
    await git.raw(['init', '-b', 'main']);
    await git.raw([
      '-c',
      'user.email=cc-office@local',
      '-c',
      'user.name=cc-office',
      'commit',
      '--allow-empty',
      '-m',
      'Initial commit',
    ]);
    return { branch: 'main' };
  }

  async createWorktree(repoRoot: string, opts: CreateWorktreeOptions = {}): Promise<WorktreeInfo> {
    const { existingBranch, newBranch, baseBranch, name, path } = opts;

    // Resolve (worktreeName, branch, isNewBranch) based on mode.
    let worktreeName: string;
    let branch: string;
    let createBranch: boolean;
    if (existingBranch) {
      worktreeName = name ?? this.branchToSlug(existingBranch);
      branch = existingBranch;
      createBranch = false;
    } else if (newBranch) {
      worktreeName = name ?? this.branchToSlug(newBranch);
      branch = newBranch;
      createBranch = true;
    } else {
      // Legacy shortcut: auto-generate `worktree-<slug>` as a brand-new branch.
      worktreeName = name ?? this.generateWorktreeName();
      branch = `worktree-${worktreeName}`;
      createBranch = true;
    }
    validateWorktreeName(worktreeName);

    const worktreePath = path ?? join(repoRoot, '.claude', 'worktrees', worktreeName);

    if (await this.isExistingWorktree(worktreePath)) {
      return { name: worktreeName, path: worktreePath, branch };
    }

    if (createBranch) {
      // Legacy path preserved: prune stale refs + nuke old branch + base the
      // new branch on origin/<default>. Used by quick "Create Worktree…" action.
      await this.addWorktree(repoRoot, worktreePath, branch, baseBranch);
    } else {
      // Checkout existing branch — no fetch, no prune, no nuke.
      await mkdir(join(worktreePath, '..'), { recursive: true });
      const result = await this.rawGit(this.createGit(repoRoot), [
        'worktree',
        'add',
        worktreePath,
        branch,
      ]);
      if (result.exitCode !== 0) {
        throw new Error(result.stdout.trim() || 'git worktree add failed');
      }
    }
    return { name: worktreeName, path: worktreePath, branch };
  }

  async listBranches(repoRoot: string): Promise<string[]> {
    if ((await this.getRepoRoot(repoRoot)) === null) throw new NotARepoError(repoRoot);
    const result = await this.rawGit(this.createGit(repoRoot), [
      'branch',
      '--list',
      '--format=%(refname:short)',
    ]);
    if (result.exitCode !== 0) return [];
    return result.stdout
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }

  private branchToSlug(branch: string): string {
    return branch.replace(/\//g, '-').replace(/[^a-zA-Z0-9_-]/g, '-');
  }

  async listWorktrees(repoRoot: string): Promise<WorktreeInfo[]> {
    if ((await this.getRepoRoot(repoRoot)) === null) throw new NotARepoError(repoRoot);
    const result = await this.rawGit(this.createGit(repoRoot), ['worktree', 'list', '--porcelain']);
    if (result.exitCode !== 0) return [];
    return parseWorktreeList(result.stdout);
  }

  async deleteWorktree(repoRoot: string, name: string): Promise<void> {
    validateWorktreeName(name);
    const worktreePath = join(repoRoot, '.claude', 'worktrees', name);
    const branchName = `worktree-${name}`;
    const git = this.createGit(repoRoot);

    await this.rawGit(git, ['worktree', 'remove', worktreePath]);
    await this.rawGit(git, ['branch', '-D', branchName]);
  }

  // ── Private helpers ──

  private createGit(cwd?: string): SimpleGit {
    return simpleGit({ baseDir: cwd ?? process.cwd(), trimmed: true });
  }

  /** Checkout `branch`, trying three strategies in order:
   *   1. Plain `git checkout branch` — works if the branch already exists locally
   *   2. `git fetch origin` then retry — picks up branches created on the remote
   *      after our last fetch
   *   3. `git checkout -t origin/branch` — creates a tracking branch from the
   *      remote ref when no local branch exists yet
   *  Only the final strategy is allowed to surface its error. */
  private async checkoutWithFallback(git: SimpleGit, branch: string): Promise<void> {
    try {
      await git.checkout(branch);
      return;
    } catch (err) {
      console.debug('[GitService] checkout strategy 1 failed:', errMsg(err));
    }
    try {
      await git.fetch('origin');
      await git.checkout(branch);
      return;
    } catch (err) {
      console.debug('[GitService] checkout strategy 2 failed:', errMsg(err));
    }
    await git.checkout(['-t', `origin/${branch}`]);
  }

  private async rawGit(
    git: SimpleGit,
    args: string[],
  ): Promise<{ stdout: string; exitCode: number }> {
    try {
      const stdout = await git.raw(args);
      return { stdout, exitCode: 0 };
    } catch (err) {
      console.debug('[GitService] git raw failed:', args.join(' '), errMsg(err));
      const stdout = err instanceof GitResponseError && typeof err.git === 'string' ? err.git : '';
      return { stdout, exitCode: 1 };
    }
  }

  private async getDefaultBranch(repoRoot: string): Promise<string> {
    const git = this.createGit(repoRoot);
    const result = await this.rawGit(git, ['symbolic-ref', 'refs/remotes/origin/HEAD']);
    if (result.exitCode === 0) {
      return result.stdout.trim().replace('refs/remotes/origin/', '');
    }
    for (const name of ['main', 'master']) {
      const check = await this.rawGit(git, [
        'rev-parse',
        '--verify',
        '--quiet',
        `refs/remotes/origin/${name}`,
      ]);
      if (check.exitCode === 0) return name;
    }
    return 'main';
  }

  private async isExistingWorktree(worktreePath: string): Promise<boolean> {
    try {
      const check = await this.rawGit(this.createGit(worktreePath), [
        'rev-parse',
        '--show-toplevel',
      ]);
      return check.exitCode === 0 && resolve(check.stdout.trim()) === resolve(worktreePath);
    } catch {
      return false;
    }
  }

  private async addWorktree(
    repoRoot: string,
    worktreePath: string,
    branchName: string,
    baseBranchOverride?: string,
  ): Promise<void> {
    await mkdir(join(worktreePath, '..'), { recursive: true });

    const git = this.createGit(repoRoot);
    const defaultBranch = baseBranchOverride ?? (await this.getDefaultBranch(repoRoot));
    // Only fetch when basing on the default branch; explicit base is assumed to be local.
    let base = defaultBranch;
    if (!baseBranchOverride) {
      const fetchResult = await this.rawGit(git, ['fetch', 'origin', defaultBranch]);
      base = fetchResult.exitCode === 0 ? `origin/${defaultBranch}` : 'HEAD';
    }

    await this.rawGit(git, ['worktree', 'prune']);
    await this.rawGit(git, ['branch', '-D', branchName]);

    const result = await this.rawGit(git, [
      'worktree',
      'add',
      '-b',
      branchName,
      worktreePath,
      base,
    ]);
    if (result.exitCode !== 0) {
      throw new Error(result.stdout.trim() || 'git worktree add failed');
    }
  }

  private generateWorktreeName(): string {
    return `claude-session-${new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14)}`;
  }
}
