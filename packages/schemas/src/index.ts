// Content types
export { CONTENT_TYPE } from './content-types.ts';

// Errors
export { ERROR_CODES, type ErrorCode } from './errors.ts';

// Logger interface (runtime-free, isomorphic)
export { type Logger, type LogLevel, NOOP_LOGGER } from './logger.ts';

// Remote summoner ↔ server protocol (JSON-RPC 2.0 over WebSocket)
export { REMOTE_METHODS } from './remote/methods.ts';
export * from './remote/protocol.ts';
export * from './remote/protocol-schemas.ts';

// Zod schemas
export * from './schemas/index.ts';

// Service interfaces
export * from './services/filesystem.ts';
export * from './services/git.ts';
export * from './services/process.ts';

// Socket event types
export type {
  ClientMessage,
  ClientToServerEvents,
  MessagePayloadMap,
  ServerToClientEvents,
} from './socket-events.ts';
export { EVENTS } from './socket-events.ts';

// Topic pub/sub
export { TopicEmitter } from './topic-emitter.ts';

// Transport interfaces (no implementation)
export type { AgentTransport } from './transport/agent-transport.ts';
export type { Transport, TransportHandle } from './transport/transport.ts';
export type { SocketCallback, TypedSocket } from './transport/types.ts';

// Utils
export { type BannerItem, formatBanner } from './utils/banner.ts';
export { errMsg } from './utils/err-msg.ts';
export { getOrSet } from './utils/get-or-set.ts';
export { isRecord } from './utils/is-record.ts';
export { parseFsRoots } from './utils/parse-fs-roots.ts';

// Validators
export { validateBranchName } from './validators/branch-name.ts';
export { validateWorktreeName } from './validators/worktree-name.ts';
