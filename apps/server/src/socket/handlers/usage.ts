import { EVENTS, rateLimitInternalPayloadSchema } from '@code-quest/schemas';
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

  emitter.on(EVENTS.system.rate_limit, onRateLimit);
}
