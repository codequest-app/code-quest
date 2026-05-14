// Node-only exports — NOT safe for browser/client bundles.
// Client code should import from '@code-quest/shared' (barrel) instead.

export {
  type LogConfig,
  type Logger,
  type LogLevel,
  NOOP_LOGGER,
  parseLogConfig,
} from './logger.ts';

export { toRpcSocket, wsAdapter } from './transport/adapters/ws-adapter.ts';
export type { AgentTransport } from './transport/agent-transport.ts';
export {
  type AuthContext,
  type Authenticator,
  NullAuthenticator,
} from './transport/authenticator.ts';
export {
  type ConnectionLoopOptions,
  createConnectionLoop,
} from './transport/connection-loop.ts';
export { parseEnvelope } from './transport/envelope.ts';
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
export { WsClient } from './transport/ws-client.ts';
export {
  type ConnectionContext,
  type ConnectionHandler,
  type Middleware,
  WsTransport,
} from './transport/ws-transport.ts';
export { errMsg } from './utils/err-msg.ts';
