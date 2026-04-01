import type {
  ClientToServerEvents,
  ControlResponse,
  ServerToClientEvents,
  SocketEvent,
} from '@code-quest/shared';
import type { ControlResponseEvent, ServerAction } from '@code-quest/summoner';
import type { Server, Socket } from 'socket.io';
import type { Channel } from './channel.ts';
import type { ChannelEventRouter } from './channel-event-router.ts';

export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export { errMsg, pickDefined } from './utils/helpers.ts';

/** Generic socket.io callback — accepts any single result argument. */
// biome-ignore lint/suspicious/noExplicitAny: required to match socket.io's typed callback contravariance
export type SocketCallback = (result: any) => void;

export type SessionBroadcastState = 'launching' | 'busy' | 'idle' | 'exited' | 'disconnected';

export interface PendingRequest {
  resolve: (value: ControlResponse) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export interface WireRunnerHooks {
  onSocketEvent?: (channel: Channel, event: SocketEvent) => void;
  onServerAction?: (channel: Channel, action: ServerAction) => void;
  onExit?: (channel: Channel, code: number | null) => void;
}

export interface RunnerListeners {
  socketEvent: (event: SocketEvent) => void;
  controlResponse: (event: ControlResponseEvent) => void;
  serverAction: (action: ServerAction) => void;
  exit: (code: number | null) => void;
}

// ── SocketHandler ──

export type ChannelEventFn = (channelId: string, ch: Channel, se: SocketEvent) => void;
export type ChannelActionFn = (channelId: string, ch: Channel, action: ServerAction) => boolean;
export type ChannelExitFn = (channelId: string, ch: Channel, code: number | null) => void;

export interface SocketHandler {
  register(socket: TypedSocket): void;
  subscribe?(router: ChannelEventRouter): void;
}
