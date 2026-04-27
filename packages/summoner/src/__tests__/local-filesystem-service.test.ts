import { join } from 'node:path';
import { vol } from 'memfs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalFilesystemService } from '../filesystem/local.ts';
import type { DirectoryEntry } from '../filesystem/types.ts';
import { FakeWatchService } from '../test/fake-watch-service.ts';

vi.mock('node:fs', async () => (await import('memfs')).fs);
vi.mock('node:fs/promises', async () => (await import('memfs')).fs.promises);

const ROOT = '/test-root';

let service: LocalFilesystemService;
let memfs: typeof import('node:fs');

beforeEach(async () => {
  vol.fromJSON({
    [join(ROOT, 'alpha/.keep')]: '',
    [join(ROOT, 'beta/nested/.keep')]: '',
    [join(ROOT, '.hidden/.keep')]: '',
    [join(ROOT, 'node_modules/.keep')]: '',
    [join(ROOT, '.git/.keep')]: '',
    [join(ROOT, 'src/index.ts')]: 'export {}',
    [join(ROOT, 'src/utils.ts')]: 'export const x = 1',
    [join(ROOT, 'package.json')]: '{}',
  });
  memfs = (await import('memfs')).fs as unknown as typeof import('node:fs');
  service = new LocalFilesystemService([ROOT], undefined, memfs);
});

afterEach(() => vol.reset());

describe('LocalFilesystemService', () => {
  describe('browseDirectories', () => {
    it('returns roots when no path', async () => {
      expect(await service.browseDirectories()).toEqual([{ name: 'test-root', path: ROOT }]);
    });

    it('lists child directories sorted', async () => {
      const names = (await service.browseDirectories(ROOT)).map((d: DirectoryEntry) => d.name);
      expect(names).toContain('alpha');
      expect(names).toContain('beta');
      expect(names).toEqual([...names].sort());
    });

    it('filters hidden directories', async () => {
      const names = (await service.browseDirectories(ROOT)).map((d: DirectoryEntry) => d.name);
      expect(names).not.toContain('.hidden');
      expect(names).not.toContain('.git');
    });

    it('filters ignored directories', async () => {
      const names = (await service.browseDirectories(ROOT)).map((d: DirectoryEntry) => d.name);
      expect(names).not.toContain('node_modules');
    });

    it('excludes symlinks', async () => {
      vol.symlinkSync(join(ROOT, 'alpha'), join(ROOT, 'link-to-alpha'));
      const names = (await service.browseDirectories(ROOT)).map((d: DirectoryEntry) => d.name);
      expect(names).not.toContain('link-to-alpha');
    });

    it('returns empty for path outside roots', async () => {
      expect(await service.browseDirectories('/etc')).toEqual([]);
    });

    it('returns empty for path traversal', async () => {
      expect(await service.browseDirectories(`${ROOT}/../../etc`)).toEqual([]);
    });

    it('returns empty for non-existent path', async () => {
      expect(await service.browseDirectories(join(ROOT, 'nope'))).toEqual([]);
    });
  });

  describe('listFiles', () => {
    it('empty pattern returns root entries', async () => {
      const results = await service.listFiles(ROOT, '');
      expect(results.some((f) => f.type === 'directory')).toBe(true);
      expect(results.some((f) => f.type === 'file')).toBe(true);
    });

    it('trailing slash lists directory contents', async () => {
      const results = await service.listFiles(ROOT, 'src/');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((f) => f.path.startsWith('src/'))).toBe(true);
    });

    it('other patterns do fuzzy search', async () => {
      const results = await service.listFiles(ROOT, 'utils');
      expect(results.some((f) => f.name.includes('utils'))).toBe(true);
    });

    describe('cache invalidation via WatchService', () => {
      it('second call without watcher event reuses cached file list', async () => {
        const watch = new FakeWatchService();
        const cached = new LocalFilesystemService([ROOT], watch, memfs);
        const a = await cached.listFiles(ROOT, '');
        vol.writeFileSync(join(ROOT, 'after-cache.ts'), '');
        const b = await cached.listFiles(ROOT, '');
        expect(b.some((f) => f.name === 'after-cache.ts')).toBe(false);
        expect(b.length).toBe(a.length);
      });

      it('watcher event invalidates cache so next call rebuilds', async () => {
        const watch = new FakeWatchService();
        const cached = new LocalFilesystemService([ROOT], watch, memfs);
        await cached.listFiles(ROOT, '');
        vol.writeFileSync(join(ROOT, 'after-invalidate.ts'), '');
        watch.simulate(ROOT, { type: 'add', path: 'after-invalidate.ts' });
        const b = await cached.listFiles(ROOT, '');
        expect(b.some((f) => f.name === 'after-invalidate.ts')).toBe(true);
      });

      it('concurrent first calls do not subscribe duplicate watchers', async () => {
        const watch = new FakeWatchService();
        let subscribeCount = 0;
        const realSubscribe = watch.subscribe.bind(watch);
        watch.subscribe = (cwd, cb) => {
          subscribeCount++;
          return realSubscribe(cwd, cb);
        };
        const cached = new LocalFilesystemService([ROOT], watch, memfs);
        await Promise.all([cached.listFiles(ROOT, ''), cached.listFiles(ROOT, '')]);
        expect(subscribeCount).toBe(1);
      });

      it('without WatchService injection, every call walks fresh (back-compat)', async () => {
        const noWatch = new LocalFilesystemService([ROOT], undefined, memfs);
        await noWatch.listFiles(ROOT, '');
        vol.writeFileSync(join(ROOT, 'no-watch.ts'), '');
        const b = await noWatch.listFiles(ROOT, '');
        expect(b.some((f) => f.name === 'no-watch.ts')).toBe(false);
      });
    });
  });

  describe('readFile', () => {
    it('reads existing file', async () => {
      expect(await service.readFile(ROOT, 'package.json')).toEqual({ content: '{}' });
    });

    it('rejects path traversal', async () => {
      expect(await service.readFile(ROOT, '../../etc/passwd')).toEqual({
        error: 'Path traversal not allowed',
      });
    });

    it('returns error for non-existent file', async () => {
      expect(await service.readFile(ROOT, 'nope.txt')).toEqual({
        error: 'File not found: nope.txt',
      });
    });
  });

  describe('exists', () => {
    it('returns true for existing directory', async () => {
      expect(await service.exists(ROOT)).toBe(true);
      expect(await service.exists(join(ROOT, 'alpha'))).toBe(true);
    });

    it('returns true for existing file', async () => {
      expect(await service.exists(join(ROOT, 'package.json'))).toBe(true);
    });

    it('returns false for non-existent path', async () => {
      expect(await service.exists(join(ROOT, 'does-not-exist'))).toBe(false);
    });

    it('returns false for path under non-existent parent', async () => {
      expect(await service.exists('/totally/nonexistent/path')).toBe(false);
    });
  });

  describe('isDirectory', () => {
    it('returns true for directory', async () => {
      expect(await service.isDirectory(ROOT)).toBe(true);
      expect(await service.isDirectory(join(ROOT, 'alpha'))).toBe(true);
    });

    it('returns false for file', async () => {
      expect(await service.isDirectory(join(ROOT, 'package.json'))).toBe(false);
    });

    it('returns false for non-existent path', async () => {
      expect(await service.isDirectory(join(ROOT, 'nope'))).toBe(false);
    });
  });

  describe('statKind (single-syscall replacement for exists+isDirectory)', () => {
    it('returns "directory" for a directory', async () => {
      expect(await service.statKind(ROOT)).toBe('directory');
      expect(await service.statKind(join(ROOT, 'alpha'))).toBe('directory');
    });

    it('returns "file" for a file', async () => {
      expect(await service.statKind(join(ROOT, 'package.json'))).toBe('file');
    });

    it('returns null for non-existent path', async () => {
      expect(await service.statKind(join(ROOT, 'nope'))).toBeNull();
    });
  });

  describe('mutations (create / delete / rename / copy / move)', () => {
    const MROOT = '/mutation-root';
    let svc: LocalFilesystemService;

    beforeEach(() => {
      vol.mkdirSync(MROOT, { recursive: true });
      svc = new LocalFilesystemService([MROOT], undefined, memfs);
    });

    it('create file then delete it', async () => {
      const p = join(MROOT, 'created.txt');
      expect(await svc.create(p, 'file')).toEqual({ ok: true });
      expect(await svc.exists(p)).toBe(true);
      expect(await svc.delete(p)).toEqual({ ok: true });
      expect(await svc.exists(p)).toBe(false);
    });

    it('create directory then delete it recursively', async () => {
      const dir = join(MROOT, 'dir-recursive');
      expect(await svc.create(dir, 'directory')).toEqual({ ok: true });
      vol.writeFileSync(join(dir, 'inner.txt'), 'content');
      expect(await svc.delete(dir)).toEqual({ ok: true });
      expect(await svc.exists(dir)).toBe(false);
    });

    it('create rejects existing target', async () => {
      const p = join(MROOT, 'pre-existing.txt');
      vol.writeFileSync(p, 'x');
      expect(await svc.create(p, 'file')).toEqual({ error: 'exists' });
    });

    it('rename moves a file', async () => {
      const a = join(MROOT, 'rename-a.txt');
      const b = join(MROOT, 'rename-b.txt');
      vol.writeFileSync(a, 'rename me');
      expect(await svc.rename(a, b)).toEqual({ ok: true });
      expect(await svc.exists(a)).toBe(false);
      expect(await svc.readFileAbsolute(b)).toEqual({ content: 'rename me' });
    });

    it('rename rejects when destination exists', async () => {
      const a = join(MROOT, 'src-collide.txt');
      const b = join(MROOT, 'dst-collide.txt');
      vol.writeFileSync(a, 'a');
      vol.writeFileSync(b, 'b');
      expect(await svc.rename(a, b)).toEqual({ error: 'exists' });
    });

    it('copy duplicates a file', async () => {
      const a = join(MROOT, 'orig.txt');
      const b = join(MROOT, 'orig-copy.txt');
      vol.writeFileSync(a, 'hello');
      expect(await svc.copy(a, b)).toEqual({ ok: true });
      expect(await svc.readFileAbsolute(b)).toEqual({ content: 'hello' });
      expect(await svc.exists(a)).toBe(true);
    });

    it('copy duplicates a directory recursively', async () => {
      const src = join(MROOT, 'tree-src');
      vol.mkdirSync(src);
      vol.writeFileSync(join(src, 'inner.txt'), 'inside');
      const dst = join(MROOT, 'tree-dst');
      expect(await svc.copy(src, dst)).toEqual({ ok: true });
      expect(await svc.readFileAbsolute(join(dst, 'inner.txt'))).toEqual({ content: 'inside' });
    });

    it('move across directories', async () => {
      const subA = join(MROOT, 'mv-a');
      const subB = join(MROOT, 'mv-b');
      vol.mkdirSync(subA);
      vol.mkdirSync(subB);
      const from = join(subA, 'item.txt');
      const to = join(subB, 'item.txt');
      vol.writeFileSync(from, 'moved');
      expect(await svc.move(from, to)).toEqual({ ok: true });
      expect(await svc.exists(from)).toBe(false);
      expect(await svc.readFileAbsolute(to)).toEqual({ content: 'moved' });
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
      expect(service.isWithinRoots(ROOT)).toBe(true);
    });

    it('returns true for paths inside a root', () => {
      expect(service.isWithinRoots(join(ROOT, 'alpha'))).toBe(true);
      expect(service.isWithinRoots(join(ROOT, 'src'))).toBe(true);
    });

    it('returns false for paths outside any root', () => {
      expect(service.isWithinRoots('/etc/passwd')).toBe(false);
      expect(service.isWithinRoots('/totally/unrelated')).toBe(false);
    });

    it('returns false for a parent of a root (cannot escape upward)', () => {
      expect(service.isWithinRoots('/')).toBe(false);
    });

    it('returns false for prefix-similar but not actually inside (foo vs foo-bar)', () => {
      const sibling = `${ROOT}-sibling`;
      expect(service.isWithinRoots(sibling)).toBe(false);
    });
  });
});
