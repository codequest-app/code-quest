// All schema exports, domain-grouped inside ./schemas/index.ts

// Errors
export { ERROR_CODES, type ErrorCode } from './errors.ts';
export * from './schemas/index.ts';
export type {
  ClientMessage,
  ClientToServerEvents,
  MessagePayloadMap,
  ServerToClientEvents,
} from './socket-events.ts';

// Utils
export { errMsg } from './utils/err-msg.ts';
export { isRecord } from './utils/is-record.ts';

// Validators
export { validateWorktreeName } from './validators/worktree-name.ts';
