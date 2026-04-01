import type {
  ClientToServerEvents,
  ControlResponse,
  ServerToClientEvents,
  SocketEvent,
} from '@code-quest/shared';
import type { ControlResponseEvent, ServerAction } from '@code-quest/summoner';
import type { Server, Socket } from 'socket.io';
import type { Channel } from './channel.ts';
import type { HandlerContext } from './context.ts';

export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function errMsg(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/**
 * Look up channel by ID. If not found, invoke callback with error and return null.
 */
export type SessionBroadcastState = 'launching' | 'busy' | 'idle' | 'exited' | 'disconnected';

export function pickDefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) result[k] = v;
  }
  return result;
}

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

export function ensureChannel(
  ctx: HandlerContext,
  channelId: string,
  callback?: (res: { error: string }) => void,
): Channel | null {
  const channel = ctx.channelManager.get(channelId);
  if (!channel) {
    callback?.({ error: 'Session not found' });
    return null;
  }
  return channel;
}
