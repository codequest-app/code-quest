import { rateLimitInternalPayloadSchema } from '@code-quest/shared';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';

export function create({
  usageTracker,
  emitter,
}: Pick<HandlerContext, 'usageTracker' | 'emitter'>): void {
  function onRateLimit(_ch: Channel | null, payload: unknown): void {
    const { info } = rateLimitInternalPayloadSchema.parse(payload);
    usageTracker.update(info);
  }

  emitter.on('system:rate_limit', onRateLimit);
}
