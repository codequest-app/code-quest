import { rateLimitPayloadSchema } from '@code-quest/shared';
import type { ChannelEventRouter } from '../channel-event-router.ts';
import type { HandlerContext } from '../context.ts';
import type { SocketHandler } from '../types.ts';

export function create(ctx: HandlerContext): SocketHandler {
  return {
    register() {},
    subscribe(router: ChannelEventRouter) {
      router.onEvent('system:rate_limit', (_channelId, _ch, se) => {
        const { info } = rateLimitPayloadSchema.parse(se.payload);
        ctx.usageTracker.update(info);
      });
    },
  };
}
