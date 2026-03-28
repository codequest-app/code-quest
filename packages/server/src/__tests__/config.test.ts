import { describe, expect, it } from 'vitest';
import { envBool, parseRawStoreDrivers } from '../config.ts';

describe('parseRawStoreDrivers', () => {
  it('accepts valid drivers', () => {
    expect(parseRawStoreDrivers('sqlite,file')).toEqual(['sqlite', 'file']);
  });

  it('filters out invalid drivers', () => {
    expect(parseRawStoreDrivers('sqlite,sqllite,file')).toEqual(['sqlite', 'file']);
  });

  it('returns empty array for empty string', () => {
    expect(parseRawStoreDrivers('')).toEqual([]);
  });

  it('trims whitespace', () => {
    expect(parseRawStoreDrivers(' mysql , sqlite ')).toEqual(['mysql', 'sqlite']);
  });
});

describe('envBool', () => {
  it('returns default when env var is undefined', () => {
    expect(envBool('NONEXISTENT_VAR')).toBe(false);
    expect(envBool('NONEXISTENT_VAR', true)).toBe(true);
  });

  it('returns true for "true" and "1"', () => {
    expect(envBool('TEST_BOOL', false, 'true')).toBe(true);
    expect(envBool('TEST_BOOL', false, '1')).toBe(true);
  });

  it('returns false for "false" and "0"', () => {
    expect(envBool('TEST_BOOL', true, 'false')).toBe(false);
    expect(envBool('TEST_BOOL', true, '0')).toBe(false);
  });

  it('returns false for unrecognized values', () => {
    expect(envBool('TEST_BOOL', false, 'yes')).toBe(false);
    expect(envBool('TEST_BOOL', false, '')).toBe(false);
  });
});
