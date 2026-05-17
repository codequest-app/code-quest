import { realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import type { RootGuard } from './types.ts';

export class LocalRootGuard implements RootGuard {
  private readonly resolvedRoots: readonly string[];
  private realRootsPromise: Promise<readonly string[]> | undefined;
  private anyRootExistsPromise: Promise<boolean> | undefined;

  constructor(roots: readonly string[]) {
    this.resolvedRoots = roots.map((r) => resolve(r));
  }

  private getRealRoots(): Promise<readonly string[]> {
    this.realRootsPromise ??= Promise.all(
      this.resolvedRoots.map((r) => realpath(r).catch(() => r)),
    );
    return this.realRootsPromise;
  }

  private anyRootExists(): Promise<boolean> {
    this.anyRootExistsPromise ??= Promise.any(
      this.resolvedRoots.map((r) => realpath(r).then(() => true)),
    ).catch(() => false);
    return this.anyRootExistsPromise;
  }

  async isStructurallyWithinRoots(path: string): Promise<boolean> {
    const real = resolve(path);
    const realRoots = await this.getRealRoots();
    for (const realRoot of realRoots) {
      if (real === realRoot) return true;
      const rel = relative(realRoot, real);
      if (rel && !rel.startsWith('..') && !isAbsolute(rel)) return true;
    }
    return false;
  }

  async isWithinRoots(path: string): Promise<boolean> {
    let real: string;
    let pathExists = true;
    try {
      real = await realpath(path);
    } catch {
      pathExists = false;
      real = resolve(path);
    }

    // If path doesn't exist but roots are real, reject — can't safely verify path is within roots.
    if (!pathExists && (await this.anyRootExists())) return false;

    const realRoots = await this.getRealRoots();
    for (const realRoot of realRoots) {
      if (real === realRoot) return true;
      const rel = relative(realRoot, real);
      if (rel && !rel.startsWith('..') && !isAbsolute(rel)) return true;
    }
    return false;
  }
}
