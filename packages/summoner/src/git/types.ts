import type {
  GitDiffResult,
  GitLogResult,
  GitStatusResult,
  WorktreeInfo,
} from '@code-quest/shared';

/** Options for `createWorktree`. Three mutually-exclusive modes:
 *  - Legacy shortcut: only `name` set → checkout new branch `worktree-<name>`
 *    (preserves the pre-Phase-10.8 API used by "Create Worktree…" quick action)
 *  - Checkout existing: `existingBranch` set → `git worktree add <path> <branch>`
 *  - New branch: `newBranch` set (plus optional `baseBranch`) → `git worktree add -b ...`
 *  When `path` is omitted it defaults to `<repoRoot>/.claude/worktrees/<slug>`. */
export interface CreateWorktreeOptions {
  name?: string;
  existingBranch?: string;
  newBranch?: string;
  baseBranch?: string;
  path?: string;
}

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

  /** Initialize a non-git directory as a git repo (with one empty commit so
   *  the default branch immediately exists). Throws AlreadyRepoError if the
   *  path is already a git repository. */
  initRepo(cwd: string): Promise<{ branch: string }>;

  /** List all local branches. Useful for "checkout existing branch" UX.
   *  Throws NotARepoError when the path is not a git repository. */
  listBranches(repoRoot: string): Promise<string[]>;

  createWorktree(repoRoot: string, opts?: CreateWorktreeOptions): Promise<WorktreeInfo>;
  /** Lists all worktrees of a repo, INCLUDING the main worktree.
   *  Throws NotARepoError when the path is not a git repository. */
  listWorktrees(repoRoot: string): Promise<WorktreeInfo[]>;
  deleteWorktree(repoRoot: string, name: string): Promise<void>;
}
