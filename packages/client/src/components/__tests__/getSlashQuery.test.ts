import { describe, expect, it } from 'vitest';
import { getSlashQuery } from '../../utils/slash-query';

describe('getSlashQuery', () => {
  it('returns null for empty input', () => {
    expect(getSlashQuery('', 0)).toBeNull();
  });

  it('detects / at beginning', () => {
    expect(getSlashQuery('/', 1)).toEqual({ query: '', start: 0, end: 1 });
  });

  it('detects /com at beginning', () => {
    expect(getSlashQuery('/com', 4)).toEqual({ query: 'com', start: 0, end: 4 });
  });

  it('detects /co after whitespace', () => {
    expect(getSlashQuery('hello /co', 9)).toEqual({ query: 'co', start: 6, end: 9 });
  });

  it('does not trigger on // (e.g. http://)', () => {
    expect(getSlashQuery('http://x', 8)).toBeNull();
  });

  it('returns null when cursor is not within slash token', () => {
    // cursor at position 3 ("hel|lo /co") — not in the slash token
    expect(getSlashQuery('hello /co', 3)).toBeNull();
  });

  it('detects when cursor is at the slash itself', () => {
    expect(getSlashQuery('/com', 1)).toEqual({ query: 'com', start: 0, end: 4 });
  });

  it('detects when cursor is at start of token', () => {
    expect(getSlashQuery('hello /com', 6)).toEqual({ query: 'com', start: 6, end: 10 });
  });
});
