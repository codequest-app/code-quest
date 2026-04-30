import { describe, expect, it } from 'vitest';
import { slugify } from '../slugify';

describe('slugify', () => {
  it('lowercases input', () => {
    expect(slugify('Hello')).toBe('hello');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('replaces non-alphanumeric characters with hyphens', () => {
    expect(slugify('src/utils/helpers.ts')).toBe('src-utils-helpers-ts');
  });

  it('collapses consecutive non-alphanumeric chars into a single hyphen', () => {
    expect(slugify('a--b')).toBe('a-b');
    expect(slugify('a/b/c')).toBe('a-b-c');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('/leading')).toBe('leading');
    expect(slugify('trailing/')).toBe('trailing');
    expect(slugify('/both/')).toBe('both');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });
});
