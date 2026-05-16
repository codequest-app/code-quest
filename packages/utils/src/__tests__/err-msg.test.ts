import { describe, expect, it } from 'vitest';
import { errMsg } from '../err-msg.ts';

describe('errMsg', () => {
  it('returns message from Error', () => {
    expect(errMsg(new Error('oops'))).toBe('oops');
  });

  it('returns fallback for non-Error', () => {
    expect(errMsg('raw string', 'fallback')).toBe('fallback');
  });

  it('coerces to string when no fallback', () => {
    expect(errMsg(42)).toBe('42');
  });
});
