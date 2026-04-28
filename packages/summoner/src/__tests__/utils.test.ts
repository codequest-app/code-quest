import { describe, expect, it } from 'vitest';
import { errorCode } from '../utils.ts';

describe('errorCode', () => {
  it('returns the code property from a NodeJS-style error', () => {
    const err = Object.assign(new Error('fail'), { code: 'ENOENT' });
    expect(errorCode(err)).toBe('ENOENT');
  });

  it('returns the code from a plain object with code', () => {
    expect(errorCode({ code: 'ENOSPC' })).toBe('ENOSPC');
  });

  it('returns undefined for a plain Error without code', () => {
    expect(errorCode(new Error('oops'))).toBeUndefined();
  });

  it('returns undefined for null', () => {
    expect(errorCode(null)).toBeUndefined();
  });

  it('returns undefined for a string', () => {
    expect(errorCode('some error')).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(errorCode(undefined)).toBeUndefined();
  });
});
