import { realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import type { RootGuard } from '@code-quest/schemas';

export class LocalRootGuard implements RootGuard {
  private readonly resolvedRoots: readonly string[];
  private realRootsPromise: Promise<readonly string[]> | undefined;

  constructor(roots: readonly string[]) {
    this.resolvedRoots = roots.map((r) => resolve(r));
  }

  private getRealRoots(): Promise<readonly string[]> {
    this.realRootsPromise ??= Promise.all(
      this.resolvedRoots.map((r) => realpath(r).catch(() => r)),
    );
    return this.realRootsPromise;
  }

  async isWithinRoots(path: string): Promise<boolean> {
    let real: string;
    try {
      real = await realpath(path);
    } catch {
      real = resolve(path);
    }
    const realRoots = await this.getRealRoots();
    for (const realRoot of realRoots) {
      if (real === realRoot) return true;
      const rel = relative(realRoot, real);
      if (rel && !rel.startsWith('..') && !isAbsolute(rel)) return true;
    }
    return false;
  }
}
