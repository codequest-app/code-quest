// All schema exports, domain-grouped inside ./schemas/index.ts

// Content types
export { CONTENT_TYPE } from './content-types.ts';

// Errors
export { ERROR_CODES, type ErrorCode } from './errors.ts';
// Remote summoner ↔ server protocol (JSON-RPC 2.0 over WebSocket)
export { REMOTE_METHODS } from './remote/methods.ts';
export * from './remote/protocol.ts';
export * from './remote/protocol-schemas.ts';
export * from './schemas/index.ts';
// Service interfaces
export * from './services/filesystem.ts';
export * from './services/git.ts';
export * from './services/process.ts';
export type {
  ClientMessage,
  ClientToServerEvents,
  MessagePayloadMap,
  ServerToClientEvents,
} from './socket-events.ts';
export { EVENTS } from './socket-events.ts';
export { TopicEmitter } from './topic-emitter.ts';
// Transport — only browser-safe schema/type re-exports; runtime lives in ./node.ts
export { type Envelope, EnvelopeSchema } from './transport/envelope.ts';
// Utils
export { getOrSet } from './utils/get-or-set.ts';
export { isRecord } from './utils/is-record.ts';
export { parseFsRoots } from './utils/parse-fs-roots.ts';

// Validators
export { validateBranchName } from './validators/branch-name.ts';
export { validateWorktreeName } from './validators/worktree-name.ts';
