import { describe, expect, it } from 'vitest';
import { cn } from '../cn.ts';

describe('cn', () => {
  it('joins simple strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('ignores falsy values', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
  });

  it('handles conditional object syntax', () => {
    expect(cn({ active: true, hidden: false })).toBe('active');
  });

  it('handles mixed args', () => {
    expect(cn('base', true && 'on', false && 'off')).toBe('base on');
  });

  it('returns empty string for no args', () => {
    expect(cn()).toBe('');
  });
});
