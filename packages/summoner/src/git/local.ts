import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  errMsg,
  type GitDiffResult,
  type GitLogResult,
  type GitStatusResult,
  validateWorktreeName as validateWorktreeNameShared,
  type WorktreeInfo,
} from '@code-quest/shared';
import { GitResponseError, type SimpleGit, simpleGit } from 'simple-git';
import type { GitService } from './types.ts';

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
      const match = WORKTREE_PATH_RE.exec(current.worktreePath);
      if (match) {
        worktrees.push({ name: match[1], path: current.worktreePath, branch: current.branch });
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
      const absolute = commonDir.startsWith('/') ? commonDir : resolve(cwd, commonDir);
      // Strip the trailing `.git` (main repo) or `.git/worktrees/<name>` (linked worktree).
      const dotGitIdx = absolute.lastIndexOf('/.git');
      if (dotGitIdx === -1) return absolute;
      return absolute.slice(0, dotGitIdx);
    } catch (err) {
      console.debug('[GitService] getProjectRoot failed:', errMsg(err));
      return null;
    }
  }

  async createWorktree(repoRoot: string, name?: string): Promise<WorktreeInfo> {
    const worktreeName = name || this.generateWorktreeName();
    validateWorktreeName(worktreeName);

    const worktreePath = join(repoRoot, '.claude', 'worktrees', worktreeName);
    const branchName = `worktree-${worktreeName}`;

    if (await this.isExistingWorktree(worktreePath)) {
      return { name: worktreeName, path: worktreePath, branch: branchName };
    }

    await this.addWorktree(repoRoot, worktreePath, branchName);
    return { name: worktreeName, path: worktreePath, branch: branchName };
  }

  async listWorktrees(repoRoot: string): Promise<WorktreeInfo[]> {
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
  ): Promise<void> {
    await mkdir(join(repoRoot, '.claude', 'worktrees'), { recursive: true });

    const git = this.createGit(repoRoot);
    const defaultBranch = await this.getDefaultBranch(repoRoot);
    const fetchResult = await this.rawGit(git, ['fetch', 'origin', defaultBranch]);
    const base = fetchResult.exitCode === 0 ? `origin/${defaultBranch}` : 'HEAD';

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
