import type {
  GitAddResult,
  GitCommitResult,
  GitDiffResult,
  GitDiscardFileResult,
  GitFetchResult,
  GitLogResult,
  GitPullResult,
  GitPushResult,
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
  /** Stage changes (`git add`). Omit `paths` (or pass empty) to stage all
   *  changes (equivalent to `git add -A`). Pass paths to stage only those. */
  add(cwd: string, paths?: string[]): Promise<GitAddResult>;
  /** Commit staged changes. Returns 'nothing-to-commit' error when no staged
   *  changes exist (lets the UI surface a friendlier message). */
  commit(cwd: string, message: string): Promise<GitCommitResult>;
  /** Push the current branch to its upstream. Returns typed errors for
   *  'no-upstream' / 'rejected' (non-FF). */
  push(cwd: string): Promise<GitPushResult>;
  /** Fetch all remotes (`git fetch --all`). Errors bubble as `{ error }`;
   *  no typed variants — fetch rarely has actionable failure modes. */
  fetch(cwd: string): Promise<GitFetchResult>;
  /** Pull the current branch with fast-forward-only (`git pull --ff-only`).
   *  `fastForwarded: true` if HEAD actually moved; `false` if already
   *  up-to-date. Returns `{ error: 'non-ff' }` when remote has diverged —
   *  UI tells user to resolve manually rather than attempting merge here. */
  pull(cwd: string): Promise<GitPullResult>;
  /** Discard unstaged working-tree edits for a single file
   *  (`git checkout -- <file>`). Does NOT unstage — a separate
   *  operation. File path is repo-relative as reported by git status. */
  discardFile(cwd: string, file: string): Promise<GitDiscardFileResult>;

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
  /** Rename the branch of a worktree (`git -C <wt> branch -m <newName>`).
   *  Worktree directory name stays unchanged. Returns the new branch name. */
  renameWorktree(worktreeCwd: string, newBranchName: string): Promise<{ branch: string }>;
  /** Remove a worktree's working directory while keeping the branch ref.
   *  Returns `{ error: 'dirty' }` when the worktree has uncommitted changes
   *  and `force` is not set. */
  archiveWorktree(
    repoRoot: string,
    name: string,
    opts?: { force?: boolean },
  ): Promise<{ ok: true } | { error: string }>;
}
