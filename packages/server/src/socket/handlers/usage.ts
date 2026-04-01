import { rateLimitPayloadSchema } from '@code-quest/shared';
import type { UsageTracker } from '../../services/usage-tracker.ts';
import type { ChannelEventRouter } from '../channel-event-router.ts';
import type { SocketHandler } from '../types.ts';

export function create(usageTracker: UsageTracker): SocketHandler {
  return {
    register() {},
    subscribe(router: ChannelEventRouter) {
      router.onEvent('system:rate_limit', (_channelId, _ch, se) => {
        const { info } = rateLimitPayloadSchema.parse(se.payload);
        usageTracker.update(info);
      });
    },
  };
}
