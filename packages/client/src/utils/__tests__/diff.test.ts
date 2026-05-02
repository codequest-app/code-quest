import { describe, expect, it } from 'vitest';
import {
  extractNewContent,
  generateUnifiedDiff,
  isDiff,
  parseDiffFileName,
  parseHunkStart,
} from '../diff.ts';

const sampleDiff = [
  '--- a/file.txt',
  '+++ b/file.txt',
  '@@ -1,2 +1,2 @@',
  '-old line',
  '+new line',
  ' same line',
].join('\n');

describe('isDiff', () => {
  it('detects unified diff format', () => {
    expect(isDiff(sampleDiff)).toBe(true);
    expect(isDiff('plain text')).toBe(false);
  });

  it('returns false for diff without @@ hunks', () => {
    expect(isDiff('--- a/file\n+++ b/file\n')).toBe(false);
  });
});

describe('parseDiffFileName', () => {
  it('extracts filename from b/ prefix', () => {
    expect(parseDiffFileName(sampleDiff)).toBe('file.txt');
  });

  it('returns null for content without filename', () => {
    expect(parseDiffFileName('@@ -1,3 +1,3 @@\n-old\n+new')).toBeNull();
  });
});

describe('extractNewContent', () => {
  it('returns only added and context lines', () => {
    expect(extractNewContent(sampleDiff)).toBe('new line\n same line');
  });
});

describe('generateUnifiedDiff', () => {
  it('generates unified diff with correct a/ b/ headers', () => {
    const result = generateUnifiedDiff('old\n', 'new\n', 'file.txt');
    expect(result).toContain('--- a/file.txt');
    expect(result).toContain('+++ b/file.txt');
  });

  it('includes removed and added lines', () => {
    const result = generateUnifiedDiff('old\n', 'new\n', 'file.txt');
    expect(result).toContain('-old');
    expect(result).toContain('+new');
  });

  it('uses full file path in headers', () => {
    const result = generateUnifiedDiff('a', 'b', 'src/foo.ts');
    expect(result).toContain('--- a/src/foo.ts');
    expect(result).toContain('+++ b/src/foo.ts');
  });
});

describe('parseHunkStart', () => {
  it('parses hunk header line numbers', () => {
    expect(parseHunkStart('@@ -1,2 +1,2 @@')).toEqual({ oldStart: 1, newStart: 1 });
  });

  it('returns null for non-hunk lines', () => {
    expect(parseHunkStart('plain text')).toBeNull();
  });
});
