import { rateLimitPayloadSchema } from '@code-quest/shared';
import type { UsageTracker } from '../../services/usage-tracker.ts';
import type { ChannelEmitter } from '../channel-emitter.ts';
import type { SocketHandler } from '../types.ts';

export function create(usageTracker: UsageTracker, emitter: ChannelEmitter): SocketHandler {
  emitter.on('system:rate_limit', (_ch, payload) => {
    const { info } = rateLimitPayloadSchema.parse(payload);
    usageTracker.update(info);
  });

  return {
    register() {},
  };
}
