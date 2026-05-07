// All schema exports, domain-grouped inside ./schemas/index.ts

// Content types
export { CONTENT_TYPE } from './content-types.ts';

// Errors
export { ERROR_CODES, type ErrorCode } from './errors.ts';
// Remote daemon ↔ server protocol (JSON-RPC 2.0 over WebSocket)
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
export { toRpcSocket, wsAdapter } from './transport/adapters/ws-adapter.ts';
export {
  type AuthContext,
  type Authenticator,
  NullAuthenticator,
} from './transport/authenticator.ts';
export {
  type ConnectionLoopOptions,
  createConnectionLoop,
} from './transport/connection-loop.ts';
// Transport (envelope protocol for ws-based transport)
export { type Envelope, EnvelopeSchema, parseEnvelope } from './transport/envelope.ts';
export { auth } from './transport/middleware/auth.ts';
export { bearerAuth, PEER_TYPE_SUMMONER } from './transport/middleware/bearer-auth.ts';
export { bearerToken } from './transport/middleware/bearer-token.ts';
export { type HeartbeatOptions, heartbeat } from './transport/middleware/heartbeat.ts';
export { type ResumableOptions, resumable } from './transport/middleware/resumable.ts';
export { Pipeline, type PipelineContext, type PipelineMiddleware } from './transport/pipeline.ts';
export {
  ResumableSocket,
  type ResumableSocketOptions,
  type ResumeResult,
} from './transport/resumable-socket.ts';
export {
  RESUME_EVENT,
  RpcChannel,
  type RpcChannelOptions,
  type RpcSocket as RpcChannelSocket,
} from './transport/rpc-channel.ts';
export type { Transport, TransportHandle } from './transport/transport.ts';
export type { SocketCallback, TypedSocket } from './transport/types.ts';
export type {
  AcceptCallback,
  CreateSocketOptions,
  RpcSocket as WsRpcSocket,
  WsAdapter,
} from './transport/ws-adapter.ts';
export {
  type ConnectionContext,
  type ConnectionHandler,
  type Middleware,
  WsTransport,
  type WsTransportLogger,
} from './transport/ws-transport.ts';
// Utils
export { errMsg } from './utils/err-msg.ts';
export { getOrSet } from './utils/get-or-set.ts';
export { isRecord } from './utils/is-record.ts';
export { parseFsRoots } from './utils/parse-fs-roots.ts';

// Validators
export { validateWorktreeName } from './validators/worktree-name.ts';
