import type { ClientToServerEvents, ServerToClientEvents } from '@code-quest/shared';
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
