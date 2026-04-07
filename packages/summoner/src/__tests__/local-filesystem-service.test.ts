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

describe('LocalFilesystemService', () => {
  describe('browseDirectories', () => {
    it('returns roots when no path', () => {
      expect(service.browseDirectories()).toEqual([{ name: basename(tmpDir), path: tmpDir }]);
    });

    it('lists child directories sorted', () => {
      const names = service.browseDirectories(tmpDir).map((d: DirectoryEntry) => d.name);
      expect(names).toContain('alpha');
      expect(names).toContain('beta');
      expect(names).toEqual([...names].sort());
    });

    it('filters hidden directories', () => {
      const names = service.browseDirectories(tmpDir).map((d: DirectoryEntry) => d.name);
      expect(names).not.toContain('.hidden');
      expect(names).not.toContain('.git');
    });

    it('filters ignored directories', () => {
      const names = service.browseDirectories(tmpDir).map((d: DirectoryEntry) => d.name);
      expect(names).not.toContain('node_modules');
    });

    it('excludes symlinks', () => {
      const names = service.browseDirectories(tmpDir).map((d: DirectoryEntry) => d.name);
      expect(names).not.toContain('link-to-alpha');
    });

    it('returns empty for path outside roots', () => {
      expect(service.browseDirectories('/etc')).toEqual([]);
    });

    it('returns empty for path traversal', () => {
      expect(service.browseDirectories(`${tmpDir}/../../etc`)).toEqual([]);
    });

    it('returns empty for non-existent path', () => {
      expect(service.browseDirectories(join(tmpDir, 'nope'))).toEqual([]);
    });
  });

  describe('listFiles', () => {
    it('empty pattern returns root entries', () => {
      const results = service.listFiles(tmpDir, '');
      expect(results.some((f) => f.type === 'directory')).toBe(true);
      expect(results.some((f) => f.type === 'file')).toBe(true);
    });

    it('trailing slash lists directory contents', () => {
      const results = service.listFiles(tmpDir, 'src/');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((f) => f.path.startsWith('src/'))).toBe(true);
    });

    it('other patterns do fuzzy search', () => {
      const results = service.listFiles(tmpDir, 'utils');
      expect(results.some((f) => f.name.includes('utils'))).toBe(true);
    });
  });

  describe('readFile', () => {
    it('reads existing file', () => {
      expect(service.readFile(tmpDir, 'package.json')).toEqual({ content: '{}' });
    });

    it('rejects path traversal', () => {
      expect(service.readFile(tmpDir, '../../etc/passwd')).toEqual({
        error: 'Path traversal not allowed',
      });
    });

    it('returns error for non-existent file', () => {
      expect(service.readFile(tmpDir, 'nope.txt')).toEqual({ error: 'File not found: nope.txt' });
    });
  });
});
