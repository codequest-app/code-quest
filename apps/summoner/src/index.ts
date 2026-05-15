export type { DiffFileService } from '@code-quest/diff-file';
export { LocalDiffFileService } from '@code-quest/diff-file';
export { LocalFilesystemService, LocalRootGuard } from '@code-quest/filesystem';
export { AlreadyRepoError, detectWorktree, LocalGitService, NotARepoError } from '@code-quest/git';
export type { OpenspecService } from '@code-quest/openspec';
export { LocalOpenspecService } from '@code-quest/openspec';
export type {
  CreateWorktreeOptions,
  FilesystemService,
  GitService,
  InitializeOptions,
  ProcessHandle,
  ProcessProvider,
  ProcessRunResult,
  ResolvedControlResponse,
} from '@code-quest/schemas';
export type { Unsubscribe, WatchCallback, WatchEvent, WatchService } from '@code-quest/watch';
export { LocalWatchService } from '@code-quest/watch';
export { ClaudeAdapter } from './claude/adapter.ts';
export type { LaunchOptions } from './claude/launch-options.ts';
export type { PluginCliRunResult, PluginCliService } from './claude/plugin-cli.ts';
export { LocalPluginCliService } from './claude/plugin-cli.ts';
export { loadConfig, type RemoteConfig } from './config.ts';
export { ProcessRunner } from './runner.ts';
export { ChildProcessProvider } from './transports/child-process.ts';
export type { AdapterOutput, ParseResult, ProviderAdapter, RawEvent } from './types.ts';
export { rawEventSchema } from './types.ts';
