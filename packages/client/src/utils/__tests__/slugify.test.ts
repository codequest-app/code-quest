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

  it('removes non-ASCII characters (e.g. accented, CJK)', () => {
    expect(slugify('résumé')).toBe('r-sum');
    expect(slugify('說明.md')).toBe('md');
    expect(slugify('über')).toBe('ber');
  });

  describe('separator option', () => {
    it('uses underscore when separator is _', () => {
      expect(slugify('hello world', '_')).toBe('hello_world');
    });

    it('replaces non-alphanumeric with underscore', () => {
      expect(slugify('src/utils/helpers.ts', '_')).toBe('src_utils_helpers_ts');
    });

    it('collapses consecutive separators into one underscore', () => {
      expect(slugify('a--b', '_')).toBe('a_b');
    });

    it('trims leading and trailing underscores', () => {
      expect(slugify('/both/', '_')).toBe('both');
    });

    it('defaults to hyphen when no separator given', () => {
      expect(slugify('hello world')).toBe('hello-world');
    });
  });
});
