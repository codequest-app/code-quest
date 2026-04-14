import { describe, expect, it } from 'vitest';
import { err, ok } from '../rpc.ts';

describe('server rpc helpers', () => {
  it('ok wraps data', () => {
    const r = ok({ channelId: 'ch-1' });
    expect(r).toEqual({ ok: true, data: { channelId: 'ch-1' } });
  });

  it('err without code', () => {
    const r = err('boom');
    expect(r).toEqual({ ok: false, error: 'boom' });
    expect('code' in r).toBe(false);
  });

  it('err with code', () => {
    const r = err('not found', 'session_missing');
    expect(r).toEqual({ ok: false, error: 'not found', code: 'session_missing' });
  });
});
