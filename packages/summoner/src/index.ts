export { ClaudeAdapter } from './claude/adapter.ts';
export type { LaunchOptions } from './claude/launch-options.ts';
export { LocalFilesystemService } from './filesystem/local.ts';
export type {
  DirectoryEntry,
  FileResult,
  FilesystemService,
  ReadFileResult,
} from './filesystem/types.ts';
export { detectWorktree, LocalGitService, validateWorktreeName } from './git/local.ts';
export type { GitService } from './git/types.ts';
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
