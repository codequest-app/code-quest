import type {
  GitDiffResult,
  GitLogResult,
  GitStatusResult,
  WorktreeInfo,
} from '@code-quest/shared';

export interface GitServiceCapabilities {
  /** True if this backend can create/list/delete git worktrees. */
  readonly worktree: boolean;
}

export interface GitService {
  readonly capabilities: GitServiceCapabilities;

  status(cwd: string): Promise<GitStatusResult>;
  checkout(cwd: string, branch: string): Promise<void>;
  log(cwd: string, limit?: number): Promise<GitLogResult>;
  diff(cwd: string): Promise<GitDiffResult>;

  /**
   * Top-level of the working tree containing cwd (`git rev-parse --show-toplevel`).
   * For a worktree, this is the worktree's own path — NOT the main repo.
   * Use `getProjectRoot` when you need a repo-wide identity shared across worktrees.
   */
  getRepoRoot(cwd: string): Promise<string | null>;

  /**
   * Main repo path that all worktrees of the same repo share
   * (`git rev-parse --git-common-dir` with the trailing `.git` segment stripped).
   * For a session in a worktree, returns the main working tree's path.
   * This is the stable project identity used for UI grouping and for deciding
   * where new worktrees are physically created (always flat under the main tree).
   */
  getProjectRoot(cwd: string): Promise<string | null>;

  createWorktree(repoRoot: string, name?: string): Promise<WorktreeInfo>;
  listWorktrees(repoRoot: string): Promise<WorktreeInfo[]>;
  deleteWorktree(repoRoot: string, name: string): Promise<void>;
}
