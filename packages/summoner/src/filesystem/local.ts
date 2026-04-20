import { readdir, readFile } from 'node:fs/promises';
import { basename, join, normalize, resolve } from 'node:path';
import Fuse from 'fuse.js';
import { glob } from 'glob';
import type { DirectoryEntry, FileResult, FilesystemService, ReadFileResult } from './types.ts';

const MAX_RESULTS = 20;

const GLOB_IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/coverage/**',
  '**/logs/**',
];

const BROWSE_IGNORED = new Set(['node_modules', 'dist', 'coverage', '.git']);

export class LocalFilesystemService implements FilesystemService {
  constructor(private readonly explorerRoots: readonly string[]) {}

  // ── browseDirectories ──

  async browseDirectories(path?: string): Promise<DirectoryEntry[]> {
    if (!path) {
      return this.explorerRoots.map((r) => ({ name: basename(r), path: r }));
    }

    const validated = this.validatePath(path, this.explorerRoots);
    if (!validated) return [];

    try {
      const entries = await readdir(validated, { withFileTypes: true });
      return entries
        .filter((entry) => {
          if (!entry.isDirectory()) return false;
          if (entry.name.startsWith('.')) return false;
          if (BROWSE_IGNORED.has(entry.name)) return false;
          if (entry.isSymbolicLink()) return false;
          return true;
        })
        .map((entry) => ({ name: entry.name, path: join(validated, entry.name) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      // Directory unreadable (EACCES, ENOENT, etc.) — return empty
      return [];
    }
  }

  // ── listFiles ──

  async listFiles(cwd: string, pattern: string): Promise<FileResult[]> {
    const allFiles = await this.getAllFiles(cwd);
    const allDirs = this.extractDirectories(allFiles);

    if (!pattern) {
      return this.listRootEntries(allFiles, allDirs);
    }
    if (pattern.endsWith('/')) {
      return this.listDirectory(pattern, allFiles, allDirs);
    }
    return this.fuzzySearch(pattern.toLowerCase(), allFiles, allDirs);
  }

  // ── readFile ──

  async readFile(cwd: string, filePath: string): Promise<ReadFileResult> {
    const resolvedCwd = resolve(cwd);
    const absolute = resolve(resolvedCwd, normalize(filePath));
    if (!absolute.startsWith(`${resolvedCwd}/`) && absolute !== resolvedCwd) {
      return { error: 'Path traversal not allowed' };
    }
    try {
      const content = await readFile(absolute, 'utf-8');
      return { content };
    } catch {
      return { error: `File not found: ${filePath}` };
    }
  }

  // ── Private helpers ──

  private validatePath(path: string, roots: readonly string[]): string | null {
    const resolved = resolve(path);
    for (const root of roots) {
      const resolvedRoot = resolve(root);
      if (resolved === resolvedRoot || resolved.startsWith(`${resolvedRoot}/`)) {
        return resolved;
      }
    }
    return null;
  }

  private async getAllFiles(cwd: string): Promise<string[]> {
    return glob('**/*', {
      cwd,
      dot: true,
      ignore: GLOB_IGNORE,
      nodir: true,
      maxDepth: 10,
    });
  }

  private extractDirectories(files: string[]): string[] {
    const dirs = new Set<string>();
    for (const f of files) {
      const parts = f.split('/');
      // Drop the file name (last segment); accumulate each directory prefix.
      let prefix = '';
      for (let i = 0; i < parts.length - 1; i++) {
        prefix = prefix ? `${prefix}/${parts[i]}` : parts[i];
        dirs.add(prefix);
      }
    }
    return [...dirs].map((d) => `${d}/`);
  }

  private listRootEntries(files: string[], dirs: string[]): FileResult[] {
    const seen = new Set<string>();
    const results: FileResult[] = [];

    for (const d of dirs) {
      const root = d.split('/')[0];
      if (root && !seen.has(root)) {
        seen.add(root);
        results.push({ path: `${root}/`, name: root, type: 'directory' });
      }
    }

    for (const f of files) {
      if (!f.includes('/') && !seen.has(f)) {
        seen.add(f);
        results.push({ path: f, name: f, type: 'file' });
      }
    }

    return results.sort((a, b) => a.path.localeCompare(b.path)).slice(0, MAX_RESULTS);
  }

  private listDirectory(prefix: string, files: string[], dirs: string[]): FileResult[] {
    const seen = new Set<string>();
    const results: FileResult[] = [];
    const prefixLower = prefix.toLowerCase();

    for (const d of dirs) {
      if (!d.toLowerCase().startsWith(prefixLower)) continue;
      const rest = d.slice(prefix.length);
      const segment = rest.split('/')[0];
      if (segment && !seen.has(segment)) {
        seen.add(segment);
        results.push({ path: `${prefix}${segment}/`, name: segment, type: 'directory' });
      }
    }

    for (const f of files) {
      if (!f.toLowerCase().startsWith(prefixLower)) continue;
      const rest = f.slice(prefix.length);
      if (!rest.includes('/') && !seen.has(rest)) {
        seen.add(rest);
        results.push({ path: f, name: basename(f), type: 'file' });
      }
    }

    return results.sort((a, b) => a.path.localeCompare(b.path)).slice(0, MAX_RESULTS);
  }

  private fuzzySearch(pattern: string, files: string[], dirs: string[]): FileResult[] {
    const items = [
      ...files.map((f) => ({ path: f, filename: basename(f), isDirectory: false })),
      ...dirs.map((d) => ({ path: d, filename: basename(d.slice(0, -1)), isDirectory: true })),
    ];

    const fuse = new Fuse(items, {
      includeScore: true,
      threshold: 0.5,
      keys: [
        { name: 'path', weight: 1 },
        { name: 'filename', weight: 2 },
      ],
    });

    return fuse.search(pattern, { limit: MAX_RESULTS }).map((r) => ({
      path: r.item.path,
      name: r.item.filename,
      type: r.item.isDirectory ? 'directory' : 'file',
    }));
  }
}
