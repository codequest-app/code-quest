import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LocalRootGuard } from '../filesystem/local-root-guard.ts';

const ROOT = '/test-root';

describe('LocalRootGuard', () => {
  const guard = new LocalRootGuard([ROOT]);

  it('returns true for the root itself (boundary inclusive)', () => {
    expect(guard.isWithinRoots(ROOT)).toBe(true);
  });

  it('returns true for paths inside a root', () => {
    expect(guard.isWithinRoots(join(ROOT, 'alpha'))).toBe(true);
    expect(guard.isWithinRoots(join(ROOT, 'src'))).toBe(true);
  });

  it('returns false for paths outside any root', () => {
    expect(guard.isWithinRoots('/etc/passwd')).toBe(false);
    expect(guard.isWithinRoots('/totally/unrelated')).toBe(false);
  });

  it('returns false for a parent of a root (cannot escape upward)', () => {
    expect(guard.isWithinRoots('/')).toBe(false);
  });

  it('returns false for prefix-similar but not actually inside (foo vs foo-bar)', () => {
    const sibling = `${ROOT}-sibling`;
    expect(guard.isWithinRoots(sibling)).toBe(false);
  });
});
