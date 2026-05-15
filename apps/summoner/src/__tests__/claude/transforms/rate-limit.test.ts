import { segments as s } from '@code-quest/test-kit';
import { describe, expect, it } from 'vitest';
import { expectName, toClientMessage } from '../helpers.ts';

describe('transform — rate_limit_event', () => {
  it('converts rate_limit_event with overage fields', () => {
    const result = toClientMessage(
      s.rateLimitEvent({
        status: 'rate_limited',
        rateLimitType: '5hr',
        overageStatus: 'active',
        isUsingOverage: true,
      }),
    );
    expect(result).toMatchObject({
      name: 'system:rate_limit',
      payload: {
        info: { status: 'rate_limited', overageStatus: 'active', isUsingOverage: true },
      },
    });
  });

  it('converts rate_limit_event without overage fields (backward compat)', () => {
    const base = JSON.parse(s.rateLimitEvent({ status: 'ok' }));
    delete base.rate_limit_info.overageStatus;
    delete base.rate_limit_info.isUsingOverage;
    delete base.rate_limit_info.rateLimitType;
    delete base.rate_limit_info.resetsAt;
    const result = toClientMessage(JSON.stringify(base));
    const msg = expectName(result, 'system:rate_limit');
    expect(msg.payload.info.status).toBe('ok');
    expect(msg.payload.info.overageStatus).toBeUndefined();
    expect(msg.payload.info.isUsingOverage).toBeUndefined();
  });
});
