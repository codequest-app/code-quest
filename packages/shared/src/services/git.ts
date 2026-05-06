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
} from '../schemas/index.ts';

export interface CreateWorktreeOptions {
  name?: string;
  existingBranch?: string;
  newBranch?: string;
  baseBranch?: string;
  path?: string;
}

interface GitServiceCapabilities {
  readonly worktree: boolean;
}

export interface GitService {
  readonly capabilities: GitServiceCapabilities;

  status(cwd: string): Promise<GitStatusResult>;
  checkout(cwd: string, branch: string): Promise<void>;
  log(cwd: string, limit?: number): Promise<GitLogResult>;
  diff(cwd: string, filePath?: string, status?: string): Promise<GitDiffResult>;
  add(cwd: string, paths?: string[]): Promise<GitAddResult>;
  commit(cwd: string, message: string): Promise<GitCommitResult>;
  push(cwd: string): Promise<GitPushResult>;
  fetch(cwd: string): Promise<GitFetchResult>;
  pull(cwd: string): Promise<GitPullResult>;
  discardFile(cwd: string, file: string): Promise<GitDiscardFileResult>;
  getRepoRoot(cwd: string): Promise<string | null>;
  getProjectRoot(cwd: string): Promise<string | null>;
  initRepo(cwd: string): Promise<{ branch: string }>;
  listBranches(repoRoot: string): Promise<string[]>;
  createWorktree(repoRoot: string, opts?: CreateWorktreeOptions): Promise<WorktreeInfo>;
  listWorktrees(repoRoot: string): Promise<WorktreeInfo[]>;
  deleteWorktree(repoRoot: string, name: string): Promise<void>;
  renameWorktree(worktreeCwd: string, newBranchName: string): Promise<{ branch: string }>;
  archiveWorktree(
    repoRoot: string,
    name: string,
    opts?: { force?: boolean },
  ): Promise<{ ok: true } | { error: string }>;
}
