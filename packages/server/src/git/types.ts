export interface MergeResult {
  success: boolean;
  branch: string;
  error?: string;
}

export interface GitService {
  /** Cached result, checked once during init */
  isWorktreeSupported(): boolean;
  /** Initialize: check git availability and detect project root. Call at server startup. */
  init(): Promise<void>;
  getProjectRoot(): string | null;
  createWorktree(id: string): Promise<string>;
  removeWorktree(id: string): Promise<void>;
  mergeWorktreeBranch(id: string): Promise<MergeResult>;
  cleanupAll(ids: string[]): Promise<void>;
  /** git add -A && git commit --no-verify; returns true if a commit was created */
  autoCommitAll(): Promise<boolean>;
  /** git reset HEAD~1 (mixed) — undo the auto-commit */
  resetLastCommit(): Promise<void>;
}
