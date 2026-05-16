export { AlreadyRepoError, NotARepoError } from './errors.ts';
export { LocalGitService } from './local.ts';
export { RemoteGitService } from './remote.ts';
export type {
  CreateWorktreeOptions,
  GitAddResult,
  GitCommitResult,
  GitDiffResult,
  GitDiscardFileResult,
  GitFetchResult,
  GitFileChange,
  GitLogEntry,
  GitLogResult,
  GitPullResult,
  GitPushResult,
  GitService,
  GitStatusResult,
  WorktreeInfo,
} from './types.ts';
export { assertWorktreeName, detectWorktree } from './worktree.ts';
