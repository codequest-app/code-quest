import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { basename, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LocalFilesystemService } from '../filesystem/local.ts';
import type { DirectoryEntry } from '../filesystem/types.ts';
import { FakeWatchService } from '../test/fake-watch-service.ts';

let tmpDir: string;
let service: LocalFilesystemService;

beforeAll(() => {
  tmpDir = mkdtempSync(join(os.tmpdir(), 'fs-service-test-'));
  mkdirSync(join(tmpDir, 'alpha'));
  mkdirSync(join(tmpDir, 'beta'));
  mkdirSync(join(tmpDir, 'beta', 'nested'));
  mkdirSync(join(tmpDir, '.hidden'));
  mkdirSync(join(tmpDir, 'node_modules'));
  mkdirSync(join(tmpDir, '.git'));
  symlinkSync(join(tmpDir, 'alpha'), join(tmpDir, 'link-to-alpha'));

  mkdirSync(join(tmpDir, 'src'));
  writeFileSync(join(tmpDir, 'package.json'), '{}');
  writeFileSync(join(tmpDir, 'src', 'index.ts'), 'export {}');
  writeFileSync(join(tmpDir, 'src', 'utils.ts'), 'export const x = 1');

  service = new LocalFilesystemService([tmpDir]);
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

const SKIP = !process.env.RUN_INTEGRATION;

describe.skipIf(SKIP)('LocalFilesystemService', () => {
  describe('browseDirectories', () => {
    it('returns roots when no path', async () => {
      expect(await service.browseDirectories()).toEqual([{ name: basename(tmpDir), path: tmpDir }]);
    });

    it('lists child directories sorted', async () => {
      const names = (await service.browseDirectories(tmpDir)).map((d: DirectoryEntry) => d.name);
      expect(names).toContain('alpha');
      expect(names).toContain('beta');
      expect(names).toEqual([...names].sort());
    });

    it('filters hidden directories', async () => {
      const names = (await service.browseDirectories(tmpDir)).map((d: DirectoryEntry) => d.name);
      expect(names).not.toContain('.hidden');
      expect(names).not.toContain('.git');
    });

    it('filters ignored directories', async () => {
      const names = (await service.browseDirectories(tmpDir)).map((d: DirectoryEntry) => d.name);
      expect(names).not.toContain('node_modules');
    });

    it('excludes symlinks', async () => {
      const names = (await service.browseDirectories(tmpDir)).map((d: DirectoryEntry) => d.name);
      expect(names).not.toContain('link-to-alpha');
    });

    it('returns empty for path outside roots', async () => {
      expect(await service.browseDirectories('/etc')).toEqual([]);
    });

    it('returns empty for path traversal', async () => {
      expect(await service.browseDirectories(`${tmpDir}/../../etc`)).toEqual([]);
    });

    it('returns empty for non-existent path', async () => {
      expect(await service.browseDirectories(join(tmpDir, 'nope'))).toEqual([]);
    });
  });

  describe('listFiles', () => {
    it('empty pattern returns root entries', async () => {
      const results = await service.listFiles(tmpDir, '');
      expect(results.some((f) => f.type === 'directory')).toBe(true);
      expect(results.some((f) => f.type === 'file')).toBe(true);
    });

    it('trailing slash lists directory contents', async () => {
      const results = await service.listFiles(tmpDir, 'src/');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((f) => f.path.startsWith('src/'))).toBe(true);
    });

    it('other patterns do fuzzy search', async () => {
      const results = await service.listFiles(tmpDir, 'utils');
      expect(results.some((f) => f.name.includes('utils'))).toBe(true);
    });

    describe('cache invalidation via WatchService', () => {
      it('second call without watcher event reuses cached file list', async () => {
        const watch = new FakeWatchService();
        const cached = new LocalFilesystemService([tmpDir], watch);
        const a = await cached.listFiles(tmpDir, '');
        // Add a file AFTER the first call. Without invalidation, the cached
        // result must NOT include it (proves the second call hit cache).
        const newFile = join(tmpDir, 'after-cache.ts');
        writeFileSync(newFile, '');
        try {
          const b = await cached.listFiles(tmpDir, '');
          expect(b.some((f) => f.name === 'after-cache.ts')).toBe(false);
          expect(b.length).toBe(a.length);
        } finally {
          rmSync(newFile);
        }
      });

      it('watcher event invalidates cache so next call rebuilds', async () => {
        const watch = new FakeWatchService();
        const cached = new LocalFilesystemService([tmpDir], watch);
        await cached.listFiles(tmpDir, '');
        const newFile = join(tmpDir, 'after-invalidate.ts');
        writeFileSync(newFile, '');
        try {
          watch.simulate(tmpDir, { type: 'add', path: 'after-invalidate.ts' });
          const b = await cached.listFiles(tmpDir, '');
          expect(b.some((f) => f.name === 'after-invalidate.ts')).toBe(true);
        } finally {
          rmSync(newFile);
        }
      });

      it('concurrent first calls do not subscribe duplicate watchers', async () => {
        const watch = new FakeWatchService();
        let subscribeCount = 0;
        const realSubscribe = watch.subscribe.bind(watch);
        watch.subscribe = (cwd, cb) => {
          subscribeCount++;
          return realSubscribe(cwd, cb);
        };
        const cached = new LocalFilesystemService([tmpDir], watch);
        // Fire concurrent first calls — without dedup, each promise reaches
        // the subscribe path and leaks an extra watcher.
        await Promise.all([cached.listFiles(tmpDir, ''), cached.listFiles(tmpDir, '')]);
        expect(subscribeCount).toBe(1);
      });

      it('without WatchService injection, every call walks fresh (back-compat)', async () => {
        const noWatch = new LocalFilesystemService([tmpDir]);
        await noWatch.listFiles(tmpDir, '');
        const newFile = join(tmpDir, 'no-watch.ts');
        writeFileSync(newFile, '');
        try {
          // Cache exists but is never invalidated — so the second call still
          // returns cached data (no watcher = static snapshot).
          const b = await noWatch.listFiles(tmpDir, '');
          expect(b.some((f) => f.name === 'no-watch.ts')).toBe(false);
        } finally {
          rmSync(newFile);
        }
      });
    });
  });

  describe('readFile', () => {
    it('reads existing file', async () => {
      expect(await service.readFile(tmpDir, 'package.json')).toEqual({ content: '{}' });
    });

    it('rejects path traversal', async () => {
      expect(await service.readFile(tmpDir, '../../etc/passwd')).toEqual({
        error: 'Path traversal not allowed',
      });
    });

    it('returns error for non-existent file', async () => {
      expect(await service.readFile(tmpDir, 'nope.txt')).toEqual({
        error: 'File not found: nope.txt',
      });
    });
  });

  describe('exists', () => {
    it('returns true for existing directory', async () => {
      expect(await service.exists(tmpDir)).toBe(true);
      expect(await service.exists(join(tmpDir, 'alpha'))).toBe(true);
    });

    it('returns true for existing file', async () => {
      expect(await service.exists(join(tmpDir, 'package.json'))).toBe(true);
    });

    it('returns false for non-existent path', async () => {
      expect(await service.exists(join(tmpDir, 'does-not-exist'))).toBe(false);
    });

    it('returns false for path under non-existent parent', async () => {
      expect(await service.exists('/totally/nonexistent/path')).toBe(false);
    });
  });

  describe('isDirectory', () => {
    it('returns true for directory', async () => {
      expect(await service.isDirectory(tmpDir)).toBe(true);
      expect(await service.isDirectory(join(tmpDir, 'alpha'))).toBe(true);
    });

    it('returns false for file', async () => {
      expect(await service.isDirectory(join(tmpDir, 'package.json'))).toBe(false);
    });

    it('returns false for non-existent path', async () => {
      expect(await service.isDirectory(join(tmpDir, 'nope'))).toBe(false);
    });
  });

  describe('statKind (single-syscall replacement for exists+isDirectory)', () => {
    it('returns "directory" for a directory', async () => {
      expect(await service.statKind(tmpDir)).toBe('directory');
      expect(await service.statKind(join(tmpDir, 'alpha'))).toBe('directory');
    });

    it('returns "file" for a file', async () => {
      expect(await service.statKind(join(tmpDir, 'package.json'))).toBe('file');
    });

    it('returns null for non-existent path', async () => {
      expect(await service.statKind(join(tmpDir, 'nope'))).toBeNull();
    });
  });

  describe('mutations (create / delete / rename / copy / move)', () => {
    let mtmp: string;
    let svc: LocalFilesystemService;
    beforeAll(() => {
      mtmp = mkdtempSync(join(os.tmpdir(), 'fs-mutation-test-'));
      svc = new LocalFilesystemService([mtmp]);
    });
    afterAll(() => {
      rmSync(mtmp, { recursive: true, force: true });
    });

    it('create file then delete it', async () => {
      const p = join(mtmp, 'created.txt');
      expect(await svc.create(p, 'file')).toEqual({ ok: true });
      expect(await svc.exists(p)).toBe(true);
      expect(await svc.delete(p)).toEqual({ ok: true });
      expect(await svc.exists(p)).toBe(false);
    });

    it('create directory then delete it recursively', async () => {
      const dir = join(mtmp, 'dir-recursive');
      expect(await svc.create(dir, 'directory')).toEqual({ ok: true });
      writeFileSync(join(dir, 'inner.txt'), 'content');
      expect(await svc.delete(dir)).toEqual({ ok: true });
      expect(await svc.exists(dir)).toBe(false);
    });

    it('create rejects existing target', async () => {
      const p = join(mtmp, 'pre-existing.txt');
      writeFileSync(p, 'x');
      expect(await svc.create(p, 'file')).toEqual({ error: 'exists' });
      rmSync(p);
    });

    it('rename moves a file', async () => {
      const a = join(mtmp, 'rename-a.txt');
      const b = join(mtmp, 'rename-b.txt');
      writeFileSync(a, 'rename me');
      expect(await svc.rename(a, b)).toEqual({ ok: true });
      expect(await svc.exists(a)).toBe(false);
      expect(await svc.readFileAbsolute(b)).toEqual({ content: 'rename me' });
      rmSync(b);
    });

    it('rename rejects when destination exists', async () => {
      const a = join(mtmp, 'src-collide.txt');
      const b = join(mtmp, 'dst-collide.txt');
      writeFileSync(a, 'a');
      writeFileSync(b, 'b');
      expect(await svc.rename(a, b)).toEqual({ error: 'exists' });
      rmSync(a);
      rmSync(b);
    });

    it('copy duplicates a file', async () => {
      const a = join(mtmp, 'orig.txt');
      const b = join(mtmp, 'orig-copy.txt');
      writeFileSync(a, 'hello');
      expect(await svc.copy(a, b)).toEqual({ ok: true });
      expect(await svc.readFileAbsolute(b)).toEqual({ content: 'hello' });
      expect(await svc.exists(a)).toBe(true);
      rmSync(a);
      rmSync(b);
    });

    it('copy duplicates a directory recursively', async () => {
      const src = join(mtmp, 'tree-src');
      const dst = join(mtmp, 'tree-dst');
      mkdirSync(src);
      writeFileSync(join(src, 'inner.txt'), 'inside');
      expect(await svc.copy(src, dst)).toEqual({ ok: true });
      expect(await svc.readFileAbsolute(join(dst, 'inner.txt'))).toEqual({ content: 'inside' });
      rmSync(src, { recursive: true });
      rmSync(dst, { recursive: true });
    });

    it('move across directories', async () => {
      const subA = join(mtmp, 'mv-a');
      const subB = join(mtmp, 'mv-b');
      mkdirSync(subA);
      mkdirSync(subB);
      const from = join(subA, 'item.txt');
      const to = join(subB, 'item.txt');
      writeFileSync(from, 'moved');
      expect(await svc.move(from, to)).toEqual({ ok: true });
      expect(await svc.exists(from)).toBe(false);
      expect(await svc.readFileAbsolute(to)).toEqual({ content: 'moved' });
      rmSync(subA, { recursive: true });
      rmSync(subB, { recursive: true });
    });

    it('all mutations reject paths outside allowed roots', async () => {
      expect(await svc.create('/etc/passwd-clone', 'file')).toMatchObject({
        error: expect.any(String),
      });
      expect(await svc.delete('/etc/passwd')).toMatchObject({ error: expect.any(String) });
      expect(await svc.rename('/etc/a', '/etc/b')).toMatchObject({ error: expect.any(String) });
      expect(await svc.copy('/etc/a', '/etc/b')).toMatchObject({ error: expect.any(String) });
      expect(await svc.move('/etc/a', '/etc/b')).toMatchObject({ error: expect.any(String) });
    });
  });

  describe('isWithinRoots', () => {
    it('returns true for the root itself (boundary inclusive)', () => {
      expect(service.isWithinRoots(tmpDir)).toBe(true);
    });

    it('returns true for paths inside a root', () => {
      expect(service.isWithinRoots(join(tmpDir, 'alpha'))).toBe(true);
      expect(service.isWithinRoots(join(tmpDir, 'src'))).toBe(true);
    });

    it('returns false for paths outside any root', () => {
      expect(service.isWithinRoots('/etc/passwd')).toBe(false);
      expect(service.isWithinRoots('/totally/unrelated')).toBe(false);
    });

    it('returns false for a parent of a root (cannot escape upward)', () => {
      // tmpDir is e.g. /var/folders/.../fs-service-test-xxx — its parent is not allowed
      const parent = tmpDir.substring(0, tmpDir.lastIndexOf('/')) || '/';
      expect(service.isWithinRoots(parent)).toBe(false);
    });

    it('returns false for prefix-similar but not actually inside (foo vs foo-bar)', () => {
      // Service constructed with [tmpDir]; '/path/to/foo-bar' should not match '/path/to/foo'
      const sibling = `${tmpDir}-sibling`;
      expect(service.isWithinRoots(sibling)).toBe(false);
    });
  });
});
