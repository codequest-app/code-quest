import { isAbsolute, relative, resolve } from 'node:path';
import type { RootGuard } from '@code-quest/shared';

export class LocalRootGuard implements RootGuard {
  private readonly resolvedRoots: readonly string[];

  constructor(roots: readonly string[]) {
    this.resolvedRoots = roots.map((r) => resolve(r));
  }

  isWithinRoots(path: string): boolean {
    const resolved = resolve(path);
    for (const root of this.resolvedRoots) {
      if (resolved === root) return true;
      const rel = relative(root, resolved);
      if (rel && !rel.startsWith('..') && !isAbsolute(rel)) return true;
    }
    return false;
  }
}
