// Content types

// Service interfaces (re-exported from their owning packages)
export type {
  DirectoryEntry,
  FileKind,
  FileResult,
  FilesystemService,
  FsMutationResult,
  ReadFileAbsoluteResult,
  ReadFileResult,
  RootGuard,
  WriteFileResult,
} from '@code-quest/filesystem';
export { PathOutsideRootsError } from '@code-quest/filesystem';
export type { CreateWorktreeOptions, GitService } from '@code-quest/git';
export type { Unsubscribe, WatchCallback, WatchEvent, WatchService } from '@code-quest/watch';
// Remote summoner ↔ server protocol (JSON-RPC 2.0 over WebSocket)
export { REMOTE_METHODS } from './adapter/remote/methods.ts';
export * from './adapter/remote/protocol.ts';
export * from './adapter/remote/protocol-schemas.ts';
// Transport interfaces (no implementation)
export type { AgentTransport } from './adapter/transport/agent-transport.ts';
export type { Transport, TransportHandle } from './adapter/transport/transport.ts';
export type { SocketCallback, TypedSocket } from './adapter/transport/types.ts';
export { CONTENT_TYPE } from './content-types.ts';
// Errors
export { AlreadyRepoError, ERROR_CODES, type ErrorCode, NotARepoError } from './errors.ts';
// Logger interface (runtime-free, isomorphic)
export { type Logger, type LogLevel, NOOP_LOGGER } from './logger.ts';
// Process interfaces (shared contract; stays in schemas to avoid circular dep)
export type { ProcessHandle, ProcessProvider, ProcessRunResult } from './process-provider.ts';
// Zod schemas — server↔client contracts
export * from './server/actions.ts';
export * from './server/auth.ts';
export * from './server/blocks.ts';
export * from './server/common.ts';
export * from './server/control.ts';
export * from './server/control-response.ts';
export * from './server/fs.ts';
export * from './server/fs-dirty.ts';
export * from './server/git.ts';
export * from './server/hook.ts';
export * from './server/mcp.ts';
export * from './server/message.ts';
export * from './server/message-meta.ts';
export * from './server/message-payloads.ts';
export * from './server/message-stats.ts';
export * from './server/message-stream.ts';
export * from './server/notification.ts';
export * from './server/openspec.ts';
export * from './server/permission-mode.ts';
export * from './server/plan.ts';
export * from './server/plugin.ts';
export * from './server/projects.ts';
export * from './server/provider.ts';
export * from './server/question.ts';
export * from './server/rpc.ts';
export * from './server/session.ts';
export * from './server/settings.ts';
// Socket event types
export type {
  ClientMessage,
  ClientToServerEvents,
  MessagePayloadMap,
  ServerToClientEvents,
} from './server/socket-events.ts';
export { EVENTS } from './server/socket-events.ts';
export * from './server/system.ts';
export * from './server/task.ts';
export * from './server/terminal.ts';
export * from './server/worktree.ts';
// Topic pub/sub
export { TopicEmitter } from './topic-emitter.ts';

// Utils
export { type BannerItem, formatBanner } from './utils/banner.ts';
export { errMsg } from './utils/err-msg.ts';
export { getOrSet } from './utils/get-or-set.ts';
export { isRecord } from './utils/is-record.ts';
export { parseFsRoots } from './utils/parse-fs-roots.ts';

// Validators
export { validateBranchName } from './validators/branch-name.ts';
export { validateWorktreeName } from './validators/worktree-name.ts';
