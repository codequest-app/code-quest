import { describe, expect, it } from 'vitest';
import { isRecord } from '../is-record.ts';

describe('isRecord', () => {
  it('returns true for plain object', () => {
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isRecord(null)).toBe(false);
  });

  it('returns false for string', () => {
    expect(isRecord('str')).toBe(false);
  });

  it('returns false for number', () => {
    expect(isRecord(42)).toBe(false);
  });
});
