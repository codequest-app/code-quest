import { basename, dirname, join } from 'node:path';
import { mimeForPath } from '../filesystem/mime-types.ts';
import type {
  DirectoryEntry,
  FileResult,
  FilesystemService,
  FsMutationResult,
  ReadFileAbsoluteResult,
  ReadFileResult,
  WriteFileResult,
} from '../filesystem/types.ts';

export class FakeFilesystemService implements FilesystemService {
  private roots: string[] = [];
  private dirs = new Map<string, string[]>();
  private files = new Map<string, string>();

  // ── Setup API ──

  setRoots(roots: string[]): void {
    this.roots = roots;
  }

  addDirectory(parent: string, children: string[]): void {
    this.dirs.set(parent, children);
  }

  addFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  reset(): void {
    this.roots = [];
    this.dirs.clear();
    this.files.clear();
  }

  // ── FilesystemService interface ──

  async browseDirectories(path?: string): Promise<DirectoryEntry[]> {
    if (!path) {
      return this.roots.map((r) => ({ name: basename(r), path: r }));
    }

    const children = this.dirs.get(path);
    if (!children) return [];

    return children
      .slice()
      .sort()
      .map((name) => ({ name, path: join(path, name) }));
  }

  async browseEntries(
    path?: string,
  ): Promise<{ directories: DirectoryEntry[]; files: DirectoryEntry[] }> {
    const directories = await this.browseDirectories(path);
    if (!path) return { directories, files: [] };
    const prefix = path.endsWith('/') ? path : `${path}/`;
    const files: DirectoryEntry[] = [];
    for (const filePath of this.files.keys()) {
      if (!filePath.startsWith(prefix)) continue;
      const rel = filePath.slice(prefix.length);
      if (rel.includes('/')) continue;
      files.push({ name: rel, path: filePath });
    }
    files.sort((a, b) => a.name.localeCompare(b.name));
    return { directories, files };
  }

  async listFiles(cwd: string, pattern: string): Promise<FileResult[]> {
    const results: FileResult[] = [];

    // Collect directories under cwd
    const childDirs = this.dirs.get(cwd);
    if (childDirs) {
      for (const name of childDirs) {
        results.push({ path: `${name}/`, name, type: 'directory' });
      }
    }

    // Collect files under cwd
    const prefix = cwd.endsWith('/') ? cwd : `${cwd}/`;
    for (const [filePath] of this.files) {
      if (!filePath.startsWith(prefix)) continue;
      const relative = filePath.slice(prefix.length);
      if (relative.includes('/')) continue; // only direct children
      results.push({ path: relative, name: basename(relative), type: 'file' });
    }

    // Filter by pattern
    if (pattern) {
      const lower = pattern.toLowerCase();
      return results.filter(
        (r) => r.name.toLowerCase().includes(lower) || r.path.toLowerCase().includes(lower),
      );
    }

    return results;
  }

  async readFileAbsolute(absolutePath: string): Promise<ReadFileAbsoluteResult> {
    if (!this.isWithinRoots(absolutePath)) {
      return { error: 'Path outside allowed roots' };
    }
    const content = this.files.get(absolutePath);
    if (content === undefined) return { error: `File not found: ${absolutePath}` };
    const { contentType, encoding } = mimeForPath(absolutePath);
    const encoded = encoding === 'base64' ? Buffer.from(content).toString('base64') : content;
    return { content: encoded, contentType, encoding };
  }

  async writeFileAbsolute(absolutePath: string, content: string): Promise<WriteFileResult> {
    if (!this.isWithinRoots(absolutePath)) {
      return { error: 'Path outside allowed roots' };
    }
    this.files.set(absolutePath, content);
    return { ok: true };
  }

  async readFile(cwd: string, filePath: string): Promise<ReadFileResult> {
    const absolute = join(cwd, filePath);
    if (!absolute.startsWith(cwd)) {
      return { error: 'Path traversal not allowed' };
    }
    const content = this.files.get(absolute);
    if (content === undefined) {
      return { error: `File not found: ${filePath}` };
    }
    return { content };
  }

  async exists(path: string): Promise<boolean> {
    if (this.files.has(path)) return true;
    if (this.dirs.has(path)) return true;
    if (this.roots.includes(path)) return true;
    // also true if path is a child registered under any parent dirs
    for (const [parent, children] of this.dirs) {
      for (const child of children) {
        if (join(parent, child) === path) return true;
      }
    }
    return false;
  }

  async isDirectory(path: string): Promise<boolean> {
    return (await this.statKind(path)) === 'directory';
  }

  async statKind(path: string): Promise<'file' | 'directory' | null> {
    if (this.files.has(path)) return 'file';
    if (this.dirs.has(path)) return 'directory';
    if (this.roots.includes(path)) return 'directory';
    for (const [parent, children] of this.dirs) {
      for (const child of children) {
        if (join(parent, child) === path) return 'directory';
      }
    }
    return null;
  }

  // ── Mutations ──

  async create(absolutePath: string, kind: 'file' | 'directory'): Promise<FsMutationResult> {
    if (!this.isWithinRoots(absolutePath)) {
      return { error: 'Path outside allowed roots' };
    }
    if (await this.exists(absolutePath)) return { error: 'exists' };
    if (kind === 'directory') {
      this.dirs.set(absolutePath, []);
      this.linkChildToParent(absolutePath);
    } else {
      this.files.set(absolutePath, '');
    }
    return { ok: true };
  }

  async delete(absolutePath: string): Promise<FsMutationResult> {
    if (!this.isWithinRoots(absolutePath)) {
      return { error: 'Path outside allowed roots' };
    }
    this.files.delete(absolutePath);
    this.dirs.delete(absolutePath);
    // Remove descendants
    const prefix = `${absolutePath}/`;
    for (const k of [...this.files.keys()]) if (k.startsWith(prefix)) this.files.delete(k);
    for (const k of [...this.dirs.keys()]) if (k.startsWith(prefix)) this.dirs.delete(k);
    // Detach from parent listing
    this.unlinkChildFromParent(absolutePath);
    return { ok: true };
  }

  async rename(from: string, to: string): Promise<FsMutationResult> {
    if (!this.isWithinRoots(from) || !this.isWithinRoots(to)) {
      return { error: 'Path outside allowed roots' };
    }
    if (await this.exists(to)) return { error: 'exists' };
    if (this.files.has(from)) {
      this.files.set(to, this.files.get(from) ?? '');
      this.files.delete(from);
    } else if (this.dirs.has(from)) {
      // Move dir + all descendants by prefix replace
      const prefixOld = `${from}/`;
      const prefixNew = `${to}/`;
      this.dirs.set(to, this.dirs.get(from) ?? []);
      this.dirs.delete(from);
      for (const k of [...this.dirs.keys()]) {
        if (k.startsWith(prefixOld)) {
          this.dirs.set(prefixNew + k.slice(prefixOld.length), this.dirs.get(k) ?? []);
          this.dirs.delete(k);
        }
      }
      for (const k of [...this.files.keys()]) {
        if (k.startsWith(prefixOld)) {
          this.files.set(prefixNew + k.slice(prefixOld.length), this.files.get(k) ?? '');
          this.files.delete(k);
        }
      }
    } else {
      return { error: 'source not found' };
    }
    this.unlinkChildFromParent(from);
    this.linkChildToParent(to);
    return { ok: true };
  }

  async copy(from: string, to: string): Promise<FsMutationResult> {
    if (!this.isWithinRoots(from) || !this.isWithinRoots(to)) {
      return { error: 'Path outside allowed roots' };
    }
    if (await this.exists(to)) return { error: 'exists' };
    if (this.files.has(from)) {
      this.files.set(to, this.files.get(from) ?? '');
      this.linkChildToParent(to);
      return { ok: true };
    }
    if (this.dirs.has(from)) {
      const prefixOld = `${from}/`;
      const prefixNew = `${to}/`;
      this.dirs.set(to, [...(this.dirs.get(from) ?? [])]);
      this.linkChildToParent(to);
      for (const [k, v] of this.dirs.entries()) {
        if (k.startsWith(prefixOld)) {
          this.dirs.set(prefixNew + k.slice(prefixOld.length), [...v]);
        }
      }
      for (const [k, v] of this.files.entries()) {
        if (k.startsWith(prefixOld)) {
          this.files.set(prefixNew + k.slice(prefixOld.length), v);
        }
      }
      return { ok: true };
    }
    return { error: 'source not found' };
  }

  async move(from: string, to: string): Promise<FsMutationResult> {
    return this.rename(from, to);
  }

  /** Append the new entry's basename to its parent directory listing if the
   *  parent is registered. Idempotent. */
  private linkChildToParent(absolutePath: string): void {
    const parent = dirname(absolutePath);
    const name = basename(absolutePath);
    const siblings = this.dirs.get(parent);
    if (siblings && !siblings.includes(name)) {
      this.dirs.set(parent, [...siblings, name].sort());
    }
  }

  private unlinkChildFromParent(absolutePath: string): void {
    const parent = dirname(absolutePath);
    const name = basename(absolutePath);
    const siblings = this.dirs.get(parent);
    if (siblings) {
      this.dirs.set(
        parent,
        siblings.filter((n) => n !== name),
      );
    }
  }

  isWithinRoots(path: string): boolean {
    for (const root of this.roots) {
      if (path === root || path.startsWith(`${root}/`)) return true;
    }
    return false;
  }
}
