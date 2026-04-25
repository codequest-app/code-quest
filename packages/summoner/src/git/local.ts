import type {
  GitDiffResult,
  GitLogResult,
  GitStatusResult,
  WorktreeInfo,
} from '@code-quest/shared';
import { GitCommands } from './commands.ts';
import type { CreateWorktreeOptions, GitService } from './types.ts';
import { GitWorktreeOps } from './worktree.ts';

// Re-exports preserved for the package public API (summoner/src/index.ts).
export { detectWorktree, validateWorktreeName } from './worktree.ts';

/** Local git backend. Composed of `GitCommands` (plain git CLI) and
 *  `GitWorktreeOps` (worktree CRUD + path conventions). The facade
 *  exists so consumers see a single `IGitService` regardless of how
 *  the implementation is split internally. */
export class LocalGitService implements GitService {
  readonly capabilities = { worktree: true } as const;

  private commands = new GitCommands();
  private worktree = new GitWorktreeOps(this.commands);

  status = (cwd: string): Promise<GitStatusResult> => this.commands.status(cwd);
  checkout = (cwd: string, branch: string): Promise<void> => this.commands.checkout(cwd, branch);
  log = (cwd: string, limit?: number): Promise<GitLogResult> => this.commands.log(cwd, limit);
  diff = (cwd: string): Promise<GitDiffResult> => this.commands.diff(cwd);
  add = (cwd: string, paths?: string[]) => this.commands.add(cwd, paths);
  commit = (cwd: string, message: string) => this.commands.commit(cwd, message);
  push = (cwd: string) => this.commands.push(cwd);
  fetch = (cwd: string) => this.commands.fetch(cwd);
  pull = (cwd: string) => this.commands.pull(cwd);
  discardFile = (cwd: string, file: string) => this.commands.discardFile(cwd, file);
  getRepoRoot = (cwd: string): Promise<string | null> => this.commands.getRepoRoot(cwd);
  getProjectRoot = (cwd: string): Promise<string | null> => this.commands.getProjectRoot(cwd);
  initRepo = (cwd: string) => this.commands.initRepo(cwd);
  listBranches = (repoRoot: string): Promise<string[]> => this.commands.listBranches(repoRoot);

  createWorktree = (repoRoot: string, opts?: CreateWorktreeOptions): Promise<WorktreeInfo> =>
    this.worktree.createWorktree(repoRoot, opts);
  listWorktrees = (repoRoot: string): Promise<WorktreeInfo[]> =>
    this.worktree.listWorktrees(repoRoot);
  deleteWorktree = (repoRoot: string, name: string): Promise<void> =>
    this.worktree.deleteWorktree(repoRoot, name);
  renameWorktree = (worktreeCwd: string, newBranchName: string) =>
    this.worktree.renameWorktree(worktreeCwd, newBranchName);
  archiveWorktree = (repoRoot: string, name: string, opts?: { force?: boolean }) =>
    this.worktree.archiveWorktree(repoRoot, name, opts);
}
