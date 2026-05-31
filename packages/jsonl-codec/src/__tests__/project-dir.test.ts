import { describe, expect, it } from 'vitest';
import { decodeProjectDir, encodeProjectDir } from '../project-dir.ts';

describe('decodeProjectDir', () => {
  it('decodes encoded path back to absolute path', () => {
    expect(decodeProjectDir('-Users-recca0120-WebstormProjects-myapp')).toBe(
      '/Users/recca0120/WebstormProjects/myapp',
    );
  });

  it('round-trips with encodeProjectDir when path has no literal dashes', () => {
    const cwd = '/Users/foo/bar/project';
    expect(decodeProjectDir(encodeProjectDir(cwd))).toBe(cwd);
  });

  // Known limitation: paths with literal dashes are ambiguous after encoding.
  // All existing JSONL tools share this limitation. In practice, rely on the
  // cwd field inside JSONL entries rather than decoding the directory name.
  it('cannot distinguish literal dashes from path separators', () => {
    expect(decodeProjectDir('-Users-foo-bar-baz')).toBe('/Users/foo/bar/baz');
    // original could have been /Users/foo/bar-baz or /Users/foo/bar/baz
  });
});

describe('encodeProjectDir', () => {
  it('encodes slashes as dashes', () => {
    expect(encodeProjectDir('/Users/recca0120/WebstormProjects/myapp')).toBe(
      '-Users-recca0120-WebstormProjects-myapp',
    );
  });
});
