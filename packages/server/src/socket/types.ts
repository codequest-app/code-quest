import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
import type { Server, Socket } from 'socket.io';
import type { ChannelEmitter } from './channel-emitter.ts';

export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

/** Generic socket.io callback — accepts any single result argument. */
// biome-ignore lint/suspicious/noExplicitAny: required to match socket.io's typed callback contravariance
export type SocketCallback = (result: any) => void;

export interface SocketHandler {
  register(socket: TypedSocket): void;
  subscribe?(emitter: ChannelEmitter): void;
}
