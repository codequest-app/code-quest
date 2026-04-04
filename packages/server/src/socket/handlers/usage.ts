import { rateLimitInternalPayloadSchema } from '@code-quest/shared';
import type { UsageTracker } from '../../services/usage-tracker.ts';
import type { Channel } from '../channel.ts';
import type { ChannelEmitter } from '../channel-emitter.ts';

export function create(usageTracker: UsageTracker, emitter: ChannelEmitter): void {
  function onRateLimit(_ch: Channel | null, payload: unknown): void {
    const { info } = rateLimitInternalPayloadSchema.parse(payload);
    usageTracker.update(info);
  }

  emitter.on('system:rate_limit', onRateLimit);
}
