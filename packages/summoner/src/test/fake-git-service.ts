import type {
  GitDiffResult,
  GitLogResult,
  GitStatusResult,
  WorktreeInfo,
} from '@code-quest/shared';
import type { GitService } from '../git/types.ts';

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

  async createWorktree(_repoRoot: string, name?: string): Promise<WorktreeInfo> {
    const wtName = name ?? `claude-session-${Date.now()}`;
    const wt: WorktreeInfo = {
      name: wtName,
      path: `${_repoRoot}/.claude/worktrees/${wtName}`,
      branch: `worktree-${wtName}`,
    };
    this._worktrees.push(wt);
    return wt;
  }

  async listWorktrees(_repoRoot: string): Promise<WorktreeInfo[]> {
    return this._worktrees;
  }

  async deleteWorktree(_repoRoot: string, name: string): Promise<void> {
    this._worktrees = this._worktrees.filter((wt) => wt.name !== name);
  }
}
