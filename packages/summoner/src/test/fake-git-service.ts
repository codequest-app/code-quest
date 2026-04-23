import type {
  GitDiffResult,
  GitLogResult,
  GitStatusResult,
  WorktreeInfo,
} from '@code-quest/shared';
import { AlreadyRepoError, NotARepoError } from '../git/errors.ts';
import type { CreateWorktreeOptions, GitService } from '../git/types.ts';

export class FakeGitService implements GitService {
  readonly capabilities = { worktree: true } as const;

  private _branch = 'main';
  private _clean = true;
  private _changedFiles: GitStatusResult['changedFiles'] = [];
  private _logEntries: GitLogResult['entries'] = [];
  private _diff = '';
  private _repoRoot: string | null = '/repo';
  private _projectRoot: string | null = null;
  private _worktrees: WorktreeInfo[] = [];
  private _checkoutError: Error | null = null;
  /** Paths registered as git repos. Default seed `/repo` keeps legacy tests
   *  (which never call markAsRepo) working without changes. */
  private _initializedRepos = new Set<string>(['/repo']);

  // ── Setup API ──

  setBranch(branch: string): void {
    this._branch = branch;
  }

  setClean(clean: boolean): void {
    this._clean = clean;
  }

  setChangedFiles(files: GitStatusResult['changedFiles']): void {
    this._changedFiles = files;
  }

  setLogEntries(entries: GitLogResult['entries']): void {
    this._logEntries = entries;
  }

  setDiff(diff: string): void {
    this._diff = diff;
  }

  setRepoRoot(root: string | null): void {
    this._repoRoot = root;
  }

  addWorktree(wt: WorktreeInfo): void {
    this._worktrees.push(wt);
  }

  setCheckoutError(err: Error | null): void {
    this._checkoutError = err;
  }

  /** Register a path as an existing git repo (so listWorktrees won't throw). */
  markAsRepo(path: string): void {
    this._initializedRepos.add(path);
  }

  reset(): void {
    this._branch = 'main';
    this._clean = true;
    this._changedFiles = [];
    this._logEntries = [];
    this._diff = '';
    this._repoRoot = '/repo';
    this._projectRoot = null;
    this._worktrees = [];
    this._checkoutError = null;
    this._initializedRepos = new Set<string>(['/repo']);
  }

  // ── GitService interface ──

  async status(_cwd: string): Promise<GitStatusResult> {
    return {
      branch: this._branch,
      isClean: this._clean,
      changedFiles: this._changedFiles,
    };
  }

  async checkout(_cwd: string, _branch: string): Promise<void> {
    if (this._checkoutError) throw this._checkoutError;
  }

  async log(_cwd: string, limit?: number): Promise<GitLogResult> {
    const entries = limit ? this._logEntries.slice(0, limit) : this._logEntries;
    return { entries };
  }

  async diff(_cwd: string): Promise<GitDiffResult> {
    return { diff: this._diff };
  }

  setProjectRoot(root: string | null): void {
    this._projectRoot = root;
  }

  async getProjectRoot(_cwd: string): Promise<string | null> {
    return this._projectRoot;
  }

  async getRepoRoot(_cwd: string): Promise<string | null> {
    return this._repoRoot;
  }

  async initRepo(cwd: string): Promise<{ branch: string }> {
    if (this._initializedRepos.has(cwd)) throw new AlreadyRepoError(cwd);
    this._initializedRepos.add(cwd);
    this._worktrees.push({ name: 'main', path: cwd, branch: 'main' });
    return { branch: 'main' };
  }

  async createWorktree(repoRoot: string, opts: CreateWorktreeOptions = {}): Promise<WorktreeInfo> {
    const { existingBranch, newBranch, name, path } = opts;
    let wtName: string;
    let branch: string;
    if (existingBranch) {
      wtName = name ?? existingBranch.replace(/\//g, '-');
      branch = existingBranch;
    } else if (newBranch) {
      wtName = name ?? newBranch.replace(/\//g, '-');
      branch = newBranch;
    } else {
      wtName = name ?? `claude-session-${Date.now()}`;
      branch = `worktree-${wtName}`;
    }
    const wt: WorktreeInfo = {
      name: wtName,
      path: path ?? `${repoRoot}/.claude/worktrees/${wtName}`,
      branch,
    };
    this._worktrees.push(wt);
    return wt;
  }

  async listBranches(repoRoot: string): Promise<string[]> {
    if (!this._initializedRepos.has(repoRoot)) throw new NotARepoError(repoRoot);
    // Default includes 'main'; test may configure via markAsRepo + initRepo.
    const branchSet = new Set<string>(['main']);
    for (const wt of this._worktrees) {
      if (wt.branch) branchSet.add(wt.branch);
    }
    return [...branchSet];
  }

  async listWorktrees(repoRoot: string): Promise<WorktreeInfo[]> {
    if (!this._initializedRepos.has(repoRoot)) throw new NotARepoError(repoRoot);
    return this._worktrees;
  }

  async deleteWorktree(_repoRoot: string, name: string): Promise<void> {
    this._worktrees = this._worktrees.filter((wt) => wt.name !== name);
  }
}
