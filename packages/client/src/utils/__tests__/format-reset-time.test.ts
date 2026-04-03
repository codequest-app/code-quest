import { describe, expect, it } from 'vitest';
import { formatResetTime } from '../format-reset-time';

describe('formatResetTime', () => {
  it('returns "soon" when reset time is in the past', () => {
    const past = new Date(Date.now() - 60000).toISOString();
    expect(formatResetTime(past)).toBe('soon');
  });

  it('returns minutes when less than 60 minutes away', () => {
    const future = new Date(Date.now() + 45 * 60000).toISOString();
    expect(formatResetTime(future)).toBe('in 45m');
  });

  it('returns hours when less than 24 hours away', () => {
    const future = new Date(Date.now() + 3 * 3600000).toISOString();
    expect(formatResetTime(future)).toBe('in 3h');
  });

  it('returns days when 24+ hours away', () => {
    const future = new Date(Date.now() + 2 * 86400000).toISOString();
    expect(formatResetTime(future)).toBe('in 2d');
  });

  it('returns "soon" for invalid date string (NaN treated as past)', () => {
    expect(formatResetTime('not-a-date')).toBe('soon');
  });
});
