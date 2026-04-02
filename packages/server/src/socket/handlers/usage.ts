import { rateLimitPayloadSchema } from '@code-quest/shared';
import type { UsageTracker } from '../../services/usage-tracker.ts';
import type { ChannelEmitter } from '../channel-emitter.ts';

export function create(usageTracker: UsageTracker, emitter: ChannelEmitter): void {
  emitter.on('system:rate_limit', (_ch, payload) => {
    const { info } = rateLimitPayloadSchema.parse(payload);
    usageTracker.update(info);
  });
}
