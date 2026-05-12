import { realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import type { RootGuard } from '@code-quest/shared';

export class LocalRootGuard implements RootGuard {
  private readonly resolvedRoots: readonly string[];

  constructor(roots: readonly string[]) {
    this.resolvedRoots = roots.map((r) => resolve(r));
  }

  async isWithinRoots(path: string): Promise<boolean> {
    let real: string;
    try {
      real = await realpath(path);
    } catch {
      real = resolve(path);
    }
    for (const root of this.resolvedRoots) {
      let realRoot: string;
      try {
        realRoot = await realpath(root);
      } catch {
        realRoot = root;
      }
      if (real === realRoot) return true;
      const rel = relative(realRoot, real);
      if (rel && !rel.startsWith('..') && !isAbsolute(rel)) return true;
    }
    return false;
  }
}
