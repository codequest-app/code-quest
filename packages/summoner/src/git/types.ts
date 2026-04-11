import type {
  GitDiffResult,
  GitLogResult,
  GitStatusResult,
  WorktreeInfo,
} from '@code-quest/shared';

export interface GitService {
  status(cwd: string): Promise<GitStatusResult>;
  checkout(cwd: string, branch: string): Promise<void>;
  log(cwd: string, limit?: number): Promise<GitLogResult>;
  diff(cwd: string): Promise<GitDiffResult>;

  getRepoRoot(cwd: string): Promise<string | null>;
  createWorktree(repoRoot: string, name?: string): Promise<WorktreeInfo>;
  listWorktrees(repoRoot: string): Promise<WorktreeInfo[]>;
  deleteWorktree(repoRoot: string, name: string): Promise<void>;
}
