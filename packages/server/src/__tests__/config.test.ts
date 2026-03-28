import { describe, expect, it } from 'vitest';
import { parseRawStoreDrivers } from '../config.ts';

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
