import { basename, join } from 'node:path';
import type {
  DirectoryEntry,
  FileResult,
  FilesystemService,
  ReadFileResult,
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

  isWithinExplorerRoots(path: string): boolean {
    for (const root of this.roots) {
      if (path === root || path.startsWith(`${root}/`)) return true;
    }
    return false;
  }
}
