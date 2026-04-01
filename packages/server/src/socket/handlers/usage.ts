import { rateLimitPayloadSchema, type SocketEvent } from '@code-quest/shared';
import type { Channel } from '../channel.ts';
import type { HandlerContext } from '../context.ts';

export function onRunnerEvent(
  ctx: HandlerContext,
  _channelId: string,
  _ch: Channel,
  se: SocketEvent,
): boolean {
  if (se.name !== 'system:rate_limit') return false;
  const { info } = rateLimitPayloadSchema.parse(se.payload);
  ctx.usageTracker.update(info);
  return true;
}
