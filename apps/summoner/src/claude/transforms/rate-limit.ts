import type { ClientMessage } from '@code-quest/shared';
import type { z } from 'zod';
import type { rateLimitEventSchema } from '../schemas.ts';

type RateLimitEvent = z.infer<typeof rateLimitEventSchema>;

export function transformRateLimit(raw: RateLimitEvent): ClientMessage {
  const rli = raw.rate_limit_info;
  return {
    name: 'system:rate_limit',
    payload: {
      info: {
        status: rli.status,
        rateLimitType: rli.rateLimitType,
        resetsAt: rli.resetsAt != null ? String(rli.resetsAt) : undefined,
        utilization: typeof rli.utilization === 'number' ? rli.utilization : undefined,
        overageStatus: rli.overageStatus,
        isUsingOverage: rli.isUsingOverage,
      },
    },
  };
}
