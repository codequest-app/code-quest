import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  validateWorktreeName as validateWorktreeNameShared,
  type WorktreeInfo,
} from '@code-quest/shared';
import type { GitCommands } from './commands.ts';
import { NotARepoError } from './errors.ts';
import { createGit, rawGit } from './git-runner.ts';
import type { CreateWorktreeOptions } from './types.ts';

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
  flush();

  return worktrees;
}

export class GitWorktreeOps {
  constructor(private commands: GitCommands) {}

  async createWorktree(repoRoot: string, opts: CreateWorktreeOptions = {}): Promise<WorktreeInfo> {
    const { existingBranch, newBranch, baseBranch, name, path } = opts;

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
      // `branch -D` of an existing branch is destructive — only do it when
      // the branch name was auto-generated (legacy `worktree-<slug>` shortcut),
      // never when the user supplied newBranch explicitly.
      const isAutoBranch = branch === `worktree-${worktreeName}` && !newBranch;
      await this.addWorktree(repoRoot, worktreePath, branch, baseBranch, isAutoBranch);
    } else {
      await mkdir(join(worktreePath, '..'), { recursive: true });
      const result = await rawGit(createGit(repoRoot), ['worktree', 'add', worktreePath, branch]);
      if (result.exitCode !== 0) {
        throw new Error(result.stdout.trim() || 'git worktree add failed');
      }
    }
    return { name: worktreeName, path: worktreePath, branch };
  }

  async listWorktrees(repoRoot: string): Promise<WorktreeInfo[]> {
    if ((await this.commands.getRepoRoot(repoRoot)) === null) {
      throw new NotARepoError(repoRoot);
    }
    const result = await rawGit(createGit(repoRoot), ['worktree', 'list', '--porcelain']);
    if (result.exitCode !== 0) return [];
    return parseWorktreeList(result.stdout);
  }

  async deleteWorktree(repoRoot: string, name: string): Promise<void> {
    validateWorktreeName(name);
    const worktreePath = join(repoRoot, '.claude', 'worktrees', name);
    const branchName = `worktree-${name}`;
    const git = createGit(repoRoot);

    await rawGit(git, ['worktree', 'remove', worktreePath]);
    await rawGit(git, ['branch', '-D', branchName]);
  }

  async renameWorktree(worktreeCwd: string, newBranchName: string): Promise<{ branch: string }> {
    if (!/^[\w./-]+$/.test(newBranchName)) {
      throw new Error(`Invalid branch name: ${newBranchName}`);
    }
    const result = await rawGit(createGit(worktreeCwd), ['branch', '-m', newBranchName]);
    if (result.exitCode !== 0) {
      throw new Error(result.stdout || `git branch -m failed (exit ${result.exitCode})`);
    }
    return { branch: newBranchName };
  }

  async archiveWorktree(
    repoRoot: string,
    name: string,
    opts?: { force?: boolean },
  ): Promise<{ ok: true } | { error: string }> {
    validateWorktreeName(name);
    const worktreePath = join(repoRoot, '.claude', 'worktrees', name);
    const args = ['worktree', 'remove', worktreePath];
    if (opts?.force) args.push('--force');
    const result = await rawGit(createGit(repoRoot), args);
    if (result.exitCode !== 0) {
      // `result.stdout` carries the combined error message (rawGit folds
      // simple-git's stderr into it via `errMsg(err)`), so the dirty-signal
      // regex sees both stdout and stderr text.
      const errorText = result.stdout.toLowerCase();
      if (/(modified|untracked|locked|not empty|contains modifications)/.test(errorText)) {
        return { error: 'dirty' };
      }
      return { error: result.stdout || `git worktree remove failed (exit ${result.exitCode})` };
    }
    return { ok: true };
  }

  private branchToSlug(branch: string): string {
    return branch.replace(/\//g, '-').replace(/[^a-zA-Z0-9_-]/g, '-');
  }

  private generateWorktreeName(): string {
    return `claude-session-${new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14)}`;
  }

  private async isExistingWorktree(worktreePath: string): Promise<boolean> {
    try {
      const check = await rawGit(createGit(worktreePath), ['rev-parse', '--show-toplevel']);
      return check.exitCode === 0 && resolve(check.stdout.trim()) === resolve(worktreePath);
    } catch {
      return false;
    }
  }

  private async addWorktree(
    repoRoot: string,
    worktreePath: string,
    branchName: string,
    baseBranchOverride: string | undefined,
    /** Allow nuking the branch if it already exists. ONLY safe when the
     *  branch name was auto-generated by us (legacy `worktree-<slug>` shortcut).
     *  User-supplied branch names must NEVER be force-deleted. */
    allowBranchNuke: boolean,
  ): Promise<void> {
    await mkdir(join(worktreePath, '..'), { recursive: true });

    const git = createGit(repoRoot);
    const defaultBranch = baseBranchOverride ?? (await this.getDefaultBranch(repoRoot));
    let base = defaultBranch;
    if (!baseBranchOverride) {
      const fetchResult = await rawGit(git, ['fetch', 'origin', defaultBranch]);
      base = fetchResult.exitCode === 0 ? `origin/${defaultBranch}` : 'HEAD';
    }

    await rawGit(git, ['worktree', 'prune']);
    if (allowBranchNuke) {
      await rawGit(git, ['branch', '-D', branchName]);
    }

    const result = await rawGit(git, ['worktree', 'add', '-b', branchName, worktreePath, base]);
    if (result.exitCode !== 0) {
      throw new Error(result.stdout.trim() || 'git worktree add failed');
    }
  }

  private async getDefaultBranch(repoRoot: string): Promise<string> {
    const git = createGit(repoRoot);
    const result = await rawGit(git, ['symbolic-ref', 'refs/remotes/origin/HEAD']);
    if (result.exitCode === 0) {
      return result.stdout.trim().replace('refs/remotes/origin/', '');
    }
    for (const name of ['main', 'master']) {
      const check = await rawGit(git, [
        'rev-parse',
        '--verify',
        '--quiet',
        `refs/remotes/origin/${name}`,
      ]);
      if (check.exitCode === 0) return name;
    }
    return 'main';
  }
}
