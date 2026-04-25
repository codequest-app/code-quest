export { ClaudeAdapter } from './claude/adapter.ts';
export type { LaunchOptions } from './claude/launch-options.ts';
export type { PluginCliRunResult, PluginCliService } from './claude/plugin-cli.ts';
export { LocalPluginCliService } from './claude/plugin-cli.ts';
export { LocalDiffFileService } from './diff-file/local.ts';
export type { DiffFileService } from './diff-file/types.ts';
export { LocalFilesystemService } from './filesystem/local.ts';
export type {
  DirectoryEntry,
  FileResult,
  FilesystemService,
  ReadFileResult,
} from './filesystem/types.ts';
export { LocalWatchService } from './fs-watch/local.ts';
export type { Unsubscribe, WatchCallback, WatchEvent, WatchService } from './fs-watch/types.ts';
export { AlreadyRepoError, NotARepoError } from './git/errors.ts';
export { detectWorktree, LocalGitService, validateWorktreeName } from './git/local.ts';
export type { GitService } from './git/types.ts';
export { LocalOpenspecService } from './openspec/local.ts';
export type { OpenspecService } from './openspec/types.ts';
export { ProcessRunner } from './runner.ts';
export { ChildProcessProvider } from './transports/child-process.ts';
export type {
  AdapterOutput,
  InitializeOptions,
  ParseResult,
  ProcessHandle,
  ProcessProvider,
  ProviderAdapter,
  RawEvent,
  ResolvedControlResponse,
} from './types.ts';
export { rawEventSchema } from './types.ts';
