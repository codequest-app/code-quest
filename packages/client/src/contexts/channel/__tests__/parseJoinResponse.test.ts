import { describe, expect, it } from 'vitest';
import { parseJoinResponse } from '../handlers/join.ts';

const validData = { channelId: 'ch-1', state: 'busy', meta: {}, cwd: '/tmp' };

describe('parseJoinResponse', () => {
  it('returns ok with state on valid busy response', () => {
    const raw = { ok: true, data: { ...validData, state: 'busy' } };
    expect(parseJoinResponse(raw)).toEqual({ ok: true, state: 'busy' });
  });

  it('returns ok with state on valid idle response', () => {
    const raw = { ok: true, data: { ...validData, state: 'idle' } };
    expect(parseJoinResponse(raw)).toEqual({ ok: true, state: 'idle' });
  });

  it('returns error with message when ok=false', () => {
    const raw = { ok: false, error: 'Channel not found' };
    expect(parseJoinResponse(raw)).toEqual({ ok: false, error: 'Channel not found' });
  });

  it('returns generic error when parse fails', () => {
    expect(parseJoinResponse(null)).toEqual({ ok: false, error: 'Failed to join session' });
    expect(parseJoinResponse(undefined)).toEqual({ ok: false, error: 'Failed to join session' });
    expect(parseJoinResponse('bad')).toEqual({ ok: false, error: 'Failed to join session' });
  });
});
