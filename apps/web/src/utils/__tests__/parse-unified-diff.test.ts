import { describe, expect, it } from 'vitest';
import { parseUnifiedDiff } from '../parse-unified-diff.ts';

describe('parseUnifiedDiff', () => {
  it('returns empty array for empty input', () => {
    expect(parseUnifiedDiff('')).toEqual([]);
  });

  it('parses a single file diff with adds and deletes', () => {
    const input = [
      'diff --git a/foo.ts b/foo.ts',
      'index 1234..5678 100644',
      '--- a/foo.ts',
      '+++ b/foo.ts',
      '@@ -1,3 +1,3 @@',
      ' line1',
      '-old',
      '+new',
      ' line3',
    ].join('\n');
    const [file] = parseUnifiedDiff(input);
    expect(file!.path).toBe('foo.ts');
    expect(file!.isBinary).toBe(false);
    expect(file!.added).toBe(1);
    expect(file!.removed).toBe(1);
    const kinds = file!.lines.map((l) => l.kind);
    expect(kinds).toContain('hunk');
    expect(kinds).toContain('add');
    expect(kinds).toContain('del');
  });

  it('splits multiple files', () => {
    const input = [
      'diff --git a/a.ts b/a.ts',
      '@@ -1 +1 @@',
      '-x',
      '+y',
      'diff --git a/b.ts b/b.ts',
      '@@ -1 +1 @@',
      '-p',
      '+q',
    ].join('\n');
    const files = parseUnifiedDiff(input);
    expect(files.map((f) => f.path)).toEqual(['a.ts', 'b.ts']);
    expect(files[0]!.added).toBe(1);
    expect(files[1]!.removed).toBe(1);
  });

  it('detects binary files', () => {
    const input = [
      'diff --git a/img.png b/img.png',
      'Binary files a/img.png and b/img.png differ',
    ].join('\n');
    const [file] = parseUnifiedDiff(input);
    expect(file!.isBinary).toBe(true);
  });
});
