import { mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LocalRootGuard } from '../filesystem/local-root-guard.ts';

const ROOT = '/test-root';

describe('LocalRootGuard', () => {
  const guard = new LocalRootGuard([ROOT]);

  it('returns true for the root itself (boundary inclusive)', async () => {
    expect(await guard.isWithinRoots(ROOT)).toBe(true);
  });

  it('returns true for paths inside a root', async () => {
    expect(await guard.isWithinRoots(join(ROOT, 'alpha'))).toBe(true);
    expect(await guard.isWithinRoots(join(ROOT, 'src'))).toBe(true);
  });

  it('returns false for paths outside any root', async () => {
    expect(await guard.isWithinRoots('/etc/passwd')).toBe(false);
    expect(await guard.isWithinRoots('/totally/unrelated')).toBe(false);
  });

  it('returns false for a parent of a root (cannot escape upward)', async () => {
    expect(await guard.isWithinRoots('/')).toBe(false);
  });

  it('returns false for prefix-similar but not actually inside (foo vs foo-bar)', async () => {
    const sibling = `${ROOT}-sibling`;
    expect(await guard.isWithinRoots(sibling)).toBe(false);
  });

  describe('symlink-aware', () => {
    it('returns true for a real path inside roots', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'root-guard-'));
      const g = new LocalRootGuard([tmp]);
      writeFileSync(join(tmp, 'file.txt'), '');
      expect(await g.isWithinRoots(join(tmp, 'file.txt'))).toBe(true);
    });

    it('returns false for a real path outside roots', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'root-guard-'));
      const g = new LocalRootGuard([tmp]);
      expect(await g.isWithinRoots('/etc/passwd')).toBe(false);
    });

    it('returns false when symlink inside root points outside', async () => {
      const root = mkdtempSync(join(tmpdir(), 'root-guard-root-'));
      const outside = mkdtempSync(join(tmpdir(), 'root-guard-out-'));
      writeFileSync(join(outside, 'secret.txt'), 'secret');
      const link = join(root, 'escape');
      symlinkSync(outside, link);
      const g = new LocalRootGuard([root]);
      expect(await g.isWithinRoots(join(link, 'secret.txt'))).toBe(false);
    });

    it('returns false when path does not exist (realpath fails)', async () => {
      const tmp = mkdtempSync(join(tmpdir(), 'root-guard-'));
      const g = new LocalRootGuard([tmp]);
      expect(await g.isWithinRoots(join(tmp, 'nonexistent', 'path'))).toBe(false);
    });
  });
});
