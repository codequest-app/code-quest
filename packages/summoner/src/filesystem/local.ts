import { cp, mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, join, normalize, relative, resolve } from 'node:path';
import { getOrSet, PathOutsideRootsError, type RootGuard } from '@code-quest/shared';
import { errMsg } from '@code-quest/shared/node';
import Fuse from 'fuse.js';
import { glob } from 'glob';
import type { Unsubscribe, WatchService } from '../fs-watch/types.ts';
import { logger } from '../logger.ts';
import { mimeForPath } from './mime-types.ts';
import type {
  DirectoryEntry,
  FileKind,
  FileResult,
  FilesystemService,
  FsMutationResult,
  ReadFileAbsoluteResult,
  ReadFileResult,
  WriteFileResult,
} from './types.ts';

interface ListCacheEntry {
  files: string[];
  dirs: string[];
  /** Built lazily on first fuzzy query. */
  fuse: Fuse<{ path: string; filename: string; isDirectory: boolean }> | null;
  unsubscribe: Unsubscribe;
}

const MAX_RESULTS = 20;
const MAX_GLOB_DEPTH = 10;

const GLOB_IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/coverage/**',
  '**/logs/**',
];

const BROWSE_IGNORED = new Set(['node_modules', 'dist', 'coverage', '.git']);

function toRootEntry(root: string): DirectoryEntry {
  return { name: basename(root), path: root };
}

export class LocalFilesystemService implements FilesystemService {
  /** Per-cwd file-list cache for `listFiles`. Populated on first query,
   *  invalidated by chokidar (when a `WatchService` is injected). When
   *  no `WatchService` is provided (tests), every call walks fresh. */
  private listCache = new Map<string, ListCacheEntry>();
  /** In-flight builds keyed by cwd. Concurrent first-callers share one
   *  promise — without this each caller would walk the FS *and* subscribe
   *  its own watcher, leaking duplicates. */
  private listCacheInflight = new Map<string, Promise<ListCacheEntry>>();
  private readonly fsRoots: readonly string[];
  private readonly rootGuard: RootGuard;
  private readonly watch?: WatchService;
  private readonly fsImpl?: typeof import('node:fs');

  constructor(
    fsRoots: readonly string[],
    rootGuard: RootGuard,
    watch?: WatchService,
    fsImpl?: typeof import('node:fs'),
  ) {
    this.fsRoots = fsRoots;
    this.rootGuard = rootGuard;
    this.watch = watch;
    this.fsImpl = fsImpl;
  }

  async browseDirectories(path?: string): Promise<DirectoryEntry[]> {
    if (!path) {
      return this.fsRoots.map(toRootEntry);
    }
    const result = await this.readBrowseEntries(path, false);
    return result.directories;
  }

  async browseEntries(
    path?: string,
    opts?: { showHidden?: boolean },
  ): Promise<{ directories: DirectoryEntry[]; files: DirectoryEntry[] }> {
    if (!path) {
      return { directories: this.fsRoots.map(toRootEntry), files: [] };
    }
    return this.readBrowseEntries(path, opts?.showHidden ?? false);
  }

  private async readBrowseEntries(
    path: string,
    showHidden: boolean,
  ): Promise<{ directories: DirectoryEntry[]; files: DirectoryEntry[] }> {
    const validated = this.guardPath(path);

    try {
      const entries = await readdir(validated, { withFileTypes: true });
      const directories: DirectoryEntry[] = [];
      const files: DirectoryEntry[] = [];
      for (const entry of entries) {
        if (entry.isSymbolicLink()) continue;
        if (!showHidden && entry.name.startsWith('.')) continue;
        if (entry.isDirectory()) {
          if (BROWSE_IGNORED.has(entry.name)) continue;
          directories.push({ name: entry.name, path: join(validated, entry.name) });
        } else if (entry.isFile()) {
          files.push({ name: entry.name, path: join(validated, entry.name) });
        }
      }
      directories.sort((a, b) => a.name.localeCompare(b.name));
      files.sort((a, b) => a.name.localeCompare(b.name));
      return { directories, files };
    } catch (err) {
      logger.debug({ err }, '[LocalFilesystemService] readBrowseEntries failed');
      return { directories: [], files: [] };
    }
  }

  // ── listFiles ──

  async listFiles(cwd: string, pattern: string): Promise<FileResult[]> {
    const entry = await this.getOrBuildListCache(cwd);

    if (!pattern) {
      return this.listRootEntries(entry.files, entry.dirs);
    }
    if (pattern.endsWith('/')) {
      return this.listDirectory(pattern, entry.files, entry.dirs);
    }
    return this.fuzzySearch(pattern.toLowerCase(), entry);
  }

  /** Build (or return cached) file list for `cwd`. When a WatchService is
   *  injected, subscribes once; the first FS event drops the entry so the
   *  next query rebuilds. Without a WatchService, the cache still works
   *  but is never invalidated (acceptable for tests / one-shot usage). */
  private async getOrBuildListCache(cwd: string): Promise<ListCacheEntry> {
    const cached = this.listCache.get(cwd);
    if (cached) return cached;
    return getOrSet(this.listCacheInflight, cwd, () => this.buildListCacheEntry(cwd));
  }

  private async buildListCacheEntry(cwd: string): Promise<ListCacheEntry> {
    const files = await this.getAllFiles(cwd);
    const dirs = this.extractDirectories(files);
    const unsubscribe: Unsubscribe = this.watch
      ? this.watch.subscribe(cwd, () => {
          const e = this.listCache.get(cwd);
          if (!e) return;
          this.listCache.delete(cwd);
          e.unsubscribe();
        })
      : () => {};
    const entry: ListCacheEntry = { files, dirs, fuse: null, unsubscribe };
    this.listCache.set(cwd, entry);
    return entry;
  }

  // ── readFileAbsolute ──

  async readFileAbsolute(absolutePath: string): Promise<ReadFileAbsoluteResult> {
    const validated = this.guardPath(absolutePath);
    const { contentType, encoding } = mimeForPath(absolutePath);
    try {
      if (encoding === 'base64') {
        const buffer = await readFile(validated);
        return { content: buffer.toString('base64'), contentType, encoding };
      }
      const content = await readFile(validated, 'utf-8');
      return { content, contentType, encoding };
    } catch (err) {
      logger.debug({ err }, '[LocalFilesystemService] readFileAbsolute failed');
      return { error: `File not found: ${absolutePath}` };
    }
  }

  // ── writeFileAbsolute ──

  async writeFileAbsolute(absolutePath: string, content: string): Promise<WriteFileResult> {
    const validated = this.guardPath(absolutePath);
    try {
      await writeFile(validated, content, 'utf-8');
      return { ok: true };
    } catch (err) {
      return { error: errMsg(err) };
    }
  }

  // ── Mutations ──

  async create(absolutePath: string, kind: FileKind): Promise<FsMutationResult> {
    const validated = this.guardPath(absolutePath);
    try {
      if (kind === 'directory') {
        // mkdir without `recursive: true` throws EEXIST naturally — no stat pre-check needed.
        await mkdir(validated);
      } else {
        // `wx` = write-fail-if-exists. Atomic vs the prior stat-then-write TOCTOU.
        await writeFile(validated, '', { encoding: 'utf-8', flag: 'wx' });
      }
      return { ok: true };
    } catch (err) {
      if (err instanceof Error && /EEXIST/.test(err.message)) return { error: 'exists' };
      return { error: errMsg(err) };
    }
  }

  async delete(absolutePath: string): Promise<FsMutationResult> {
    const validated = this.guardPath(absolutePath);
    try {
      await rm(validated, { recursive: true, force: true });
      return { ok: true };
    } catch (err) {
      return { error: errMsg(err) };
    }
  }

  async rename(from: string, to: string): Promise<FsMutationResult> {
    const fromV = this.guardPath(from);
    const toV = this.guardPath(to);
    // POSIX rename(2) silently overwrites; this stat pre-check is the
    // no-overwrite policy. A `link` + `unlink` pattern would close the
    // race for files but doesn't generalize (directories EPERM, EXDEV).
    // Single-user dev tool — TOCTOU window is negligible in practice.
    if (await this.exists(toV)) return { error: 'exists' };
    try {
      await rename(fromV, toV);
      return { ok: true };
    } catch (err) {
      return { error: errMsg(err) };
    }
  }

  async copy(from: string, to: string): Promise<FsMutationResult> {
    const fromV = this.guardPath(from);
    const toV = this.guardPath(to);
    try {
      await cp(fromV, toV, { recursive: true, errorOnExist: true, force: false });
      return { ok: true };
    } catch (err) {
      // ERR_FS_CP_EEXIST when destination exists — surface as 'exists' for UI.
      if (err instanceof Error && /EEXIST|already exists/.test(err.message)) {
        return { error: 'exists' };
      }
      return { error: errMsg(err) };
    }
  }

  async move(from: string, to: string): Promise<FsMutationResult> {
    return this.rename(from, to);
  }

  // ── readFile ──

  async readFile(cwd: string, filePath: string): Promise<ReadFileResult> {
    const resolvedCwd = resolve(cwd);
    const absolute = resolve(resolvedCwd, normalize(filePath));
    // path.relative handles OS separators; ".." prefix signals escape.
    const rel = relative(resolvedCwd, absolute);
    if (rel.startsWith('..')) {
      return { error: 'Path traversal not allowed' };
    }
    try {
      const content = await readFile(absolute, 'utf-8');
      return { content };
    } catch (err) {
      logger.debug({ err }, '[LocalFilesystemService] readFile failed');
      return { error: `File not found: ${filePath}` };
    }
  }

  // ── Private helpers ──

  private guardPath(path: string): string {
    if (!this.rootGuard.isWithinRoots(path)) throw new PathOutsideRootsError(path);
    return resolve(path);
  }

  private async getAllFiles(cwd: string): Promise<string[]> {
    return glob('**/*', {
      cwd,
      dot: true,
      ignore: GLOB_IGNORE,
      nodir: true,
      maxDepth: MAX_GLOB_DEPTH,
      ...(this.fsImpl ? { fs: this.fsImpl } : {}),
    });
  }

  private extractDirectories(files: string[]): string[] {
    const dirs = new Set<string>();
    for (const f of files) {
      // Drop the file name (last segment); accumulate each directory prefix.
      f.split('/')
        .slice(0, -1)
        .reduce((prefix, segment) => {
          const dir = prefix ? `${prefix}/${segment}` : segment;
          dirs.add(dir);
          return dir;
        }, '');
    }
    return [...dirs].map((d) => `${d}/`);
  }

  /** Shared build step for listRootEntries / listDirectory: dedup by key, sort by path, cap. */
  private collectEntries(
    dirs: string[],
    files: string[],
    toDirEntry: (d: string) => { key: string; result: FileResult } | null,
    toFileEntry: (f: string) => { key: string; result: FileResult } | null,
  ): FileResult[] {
    const seen = new Set<string>();
    const results: FileResult[] = [];
    for (const d of dirs) {
      const item = toDirEntry(d);
      if (item && !seen.has(item.key)) {
        seen.add(item.key);
        results.push(item.result);
      }
    }
    for (const f of files) {
      const item = toFileEntry(f);
      if (item && !seen.has(item.key)) {
        seen.add(item.key);
        results.push(item.result);
      }
    }
    return results.sort((a, b) => a.path.localeCompare(b.path)).slice(0, MAX_RESULTS);
  }

  private listRootEntries(files: string[], dirs: string[]): FileResult[] {
    return this.collectEntries(
      dirs,
      files,
      (d) => {
        const root = d.split('/')[0];
        return root
          ? { key: root, result: { path: `${root}/`, name: root, type: 'directory' } }
          : null;
      },
      (f) => (f.includes('/') ? null : { key: f, result: { path: f, name: f, type: 'file' } }),
    );
  }

  private listDirectory(prefix: string, files: string[], dirs: string[]): FileResult[] {
    const prefixLower = prefix.toLowerCase();
    return this.collectEntries(
      dirs,
      files,
      (d) => {
        if (!d.toLowerCase().startsWith(prefixLower)) return null;
        const segment = d.slice(prefix.length).split('/')[0];
        return segment
          ? {
              key: segment,
              result: { path: `${prefix}${segment}/`, name: segment, type: 'directory' },
            }
          : null;
      },
      (f) => {
        if (!f.toLowerCase().startsWith(prefixLower)) return null;
        const rest = f.slice(prefix.length);
        return rest.includes('/')
          ? null
          : { key: rest, result: { path: f, name: basename(f), type: 'file' } };
      },
    );
  }

  private fuzzySearch(pattern: string, entry: ListCacheEntry): FileResult[] {
    if (!entry.fuse) {
      const items = [
        ...entry.files.map((f) => ({ path: f, filename: basename(f), isDirectory: false })),
        ...entry.dirs.map((d) => ({
          path: d,
          filename: basename(d.slice(0, -1)),
          isDirectory: true,
        })),
      ];
      entry.fuse = new Fuse(items, {
        includeScore: true,
        threshold: 0.5,
        keys: [
          { name: 'path', weight: 1 },
          { name: 'filename', weight: 2 },
        ],
      });
    }
    return entry.fuse.search(pattern, { limit: MAX_RESULTS }).map((r) => ({
      path: r.item.path,
      name: r.item.filename,
      type: r.item.isDirectory ? 'directory' : 'file',
    }));
  }

  async exists(path: string): Promise<boolean> {
    try {
      const validated = this.guardPath(path);
      await stat(validated);
      return true;
    } catch {
      return false;
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    try {
      const validated = this.guardPath(path);
      const s = await stat(validated);
      return s.isDirectory();
    } catch {
      return false;
    }
  }

  async statKind(path: string): Promise<FileKind | null> {
    try {
      const validated = this.guardPath(path);
      const s = await stat(validated);
      if (s.isDirectory()) return 'directory';
      if (s.isFile()) return 'file';
      return null;
    } catch {
      return null;
    }
  }
}
