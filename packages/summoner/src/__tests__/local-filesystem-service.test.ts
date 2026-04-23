import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { basename, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LocalFilesystemService } from '../filesystem/local.ts';
import type { DirectoryEntry } from '../filesystem/types.ts';

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

  describe('isWithinExplorerRoots', () => {
    it('returns true for the root itself (boundary inclusive)', () => {
      expect(service.isWithinExplorerRoots(tmpDir)).toBe(true);
    });

    it('returns true for paths inside a root', () => {
      expect(service.isWithinExplorerRoots(join(tmpDir, 'alpha'))).toBe(true);
      expect(service.isWithinExplorerRoots(join(tmpDir, 'src'))).toBe(true);
    });

    it('returns false for paths outside any root', () => {
      expect(service.isWithinExplorerRoots('/etc/passwd')).toBe(false);
      expect(service.isWithinExplorerRoots('/totally/unrelated')).toBe(false);
    });

    it('returns false for a parent of a root (cannot escape upward)', () => {
      // tmpDir is e.g. /var/folders/.../fs-service-test-xxx — its parent is not allowed
      const parent = tmpDir.substring(0, tmpDir.lastIndexOf('/')) || '/';
      expect(service.isWithinExplorerRoots(parent)).toBe(false);
    });

    it('returns false for prefix-similar but not actually inside (foo vs foo-bar)', () => {
      // Service constructed with [tmpDir]; '/path/to/foo-bar' should not match '/path/to/foo'
      const sibling = `${tmpDir}-sibling`;
      expect(service.isWithinExplorerRoots(sibling)).toBe(false);
    });
  });
});
