import type {
  CreateWorktreeOptions,
  GitAddResult,
  GitCommitResult,
  GitDiffResult,
  GitDiscardFileResult,
  GitFetchResult,
  GitLogResult,
  GitPullResult,
  GitPushResult,
  GitService,
  GitStatusResult,
  WorktreeInfo,
} from '@code-quest/shared';
import { REMOTE_METHODS } from '@code-quest/shared';
import type { Connection } from './connection.ts';

export class RemoteGitService implements GitService {
  readonly capabilities = { worktree: true };
  private readonly connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  status(cwd: string): Promise<GitStatusResult> {
    return this.connection.request(REMOTE_METHODS.git.status, { cwd });
  }

  checkout(cwd: string, branch: string): Promise<void> {
    return this.connection.request(REMOTE_METHODS.git.checkout, { cwd, branch });
  }

  log(cwd: string, limit?: number): Promise<GitLogResult> {
    return this.connection.request(REMOTE_METHODS.git.log, { cwd, limit });
  }

  diff(cwd: string, filePath?: string, status?: string): Promise<GitDiffResult> {
    return this.connection.request(REMOTE_METHODS.git.diff, { cwd, filePath, status });
  }

  add(cwd: string, paths?: string[]): Promise<GitAddResult> {
    return this.connection.request(REMOTE_METHODS.git.add, { cwd, paths });
  }

  commit(cwd: string, message: string): Promise<GitCommitResult> {
    return this.connection.request(REMOTE_METHODS.git.commit, { cwd, message });
  }

  push(cwd: string): Promise<GitPushResult> {
    return this.connection.request(REMOTE_METHODS.git.push, { cwd });
  }

  fetch(cwd: string): Promise<GitFetchResult> {
    return this.connection.request(REMOTE_METHODS.git.fetch, { cwd });
  }

  pull(cwd: string): Promise<GitPullResult> {
    return this.connection.request(REMOTE_METHODS.git.pull, { cwd });
  }

  discardFile(cwd: string, file: string): Promise<GitDiscardFileResult> {
    return this.connection.request(REMOTE_METHODS.git.discardFile, { cwd, file });
  }

  getRepoRoot(cwd: string): Promise<string | null> {
    return this.connection.request(REMOTE_METHODS.git.getRepoRoot, { cwd });
  }

  getProjectRoot(cwd: string): Promise<string | null> {
    return this.connection.request(REMOTE_METHODS.git.getProjectRoot, { cwd });
  }

  initRepo(cwd: string): Promise<{ branch: string }> {
    return this.connection.request(REMOTE_METHODS.git.initRepo, { cwd });
  }

  listBranches(repoRoot: string): Promise<string[]> {
    return this.connection.request(REMOTE_METHODS.git.listBranches, { repoRoot });
  }

  createWorktree(repoRoot: string, opts?: CreateWorktreeOptions): Promise<WorktreeInfo> {
    return this.connection.request(REMOTE_METHODS.git.createWorktree, { repoRoot, opts });
  }

  listWorktrees(repoRoot: string): Promise<WorktreeInfo[]> {
    return this.connection.request(REMOTE_METHODS.git.listWorktrees, { repoRoot });
  }

  deleteWorktree(repoRoot: string, name: string): Promise<void> {
    return this.connection.request(REMOTE_METHODS.git.deleteWorktree, { repoRoot, name });
  }

  renameWorktree(worktreeCwd: string, newBranchName: string): Promise<{ branch: string }> {
    return this.connection.request(REMOTE_METHODS.git.renameWorktree, {
      worktreeCwd,
      newBranchName,
    });
  }

  archiveWorktree(
    repoRoot: string,
    name: string,
    opts?: { force?: boolean },
  ): Promise<{ ok: true } | { error: string }> {
    return this.connection.request(REMOTE_METHODS.git.archiveWorktree, { repoRoot, name, opts });
  }
}
