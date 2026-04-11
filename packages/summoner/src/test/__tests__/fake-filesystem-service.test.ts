import { describe, expect, it } from 'vitest';
import { FakeFilesystemService } from '../fake-filesystem-service.ts';

describe('FakeFilesystemService', () => {
  describe('browseDirectories', () => {
    it('returns roots when no path', async () => {
      const fs = new FakeFilesystemService();
      fs.setRoots(['/projects', '/work']);
      expect(await fs.browseDirectories()).toEqual([
        { name: 'projects', path: '/projects' },
        { name: 'work', path: '/work' },
      ]);
    });

    it('returns children for a path', async () => {
      const fs = new FakeFilesystemService();
      fs.setRoots(['/projects']);
      fs.addDirectory('/projects', ['app', 'blog']);
      expect(await fs.browseDirectories('/projects')).toEqual([
        { name: 'app', path: '/projects/app' },
        { name: 'blog', path: '/projects/blog' },
      ]);
    });

    it('returns empty for unknown path', async () => {
      const fs = new FakeFilesystemService();
      fs.setRoots(['/projects']);
      expect(await fs.browseDirectories('/unknown')).toEqual([]);
    });

    it('returns empty when no roots set', async () => {
      const fs = new FakeFilesystemService();
      expect(await fs.browseDirectories()).toEqual([]);
    });

    it('children are sorted alphabetically', async () => {
      const fs = new FakeFilesystemService();
      fs.setRoots(['/projects']);
      fs.addDirectory('/projects', ['zebra', 'alpha', 'middle']);
      const names = (await fs.browseDirectories('/projects')).map((d) => d.name);
      expect(names).toEqual(['alpha', 'middle', 'zebra']);
    });
  });

  describe('listFiles', () => {
    it('returns files and directories for a cwd', async () => {
      const fs = new FakeFilesystemService();
      fs.addDirectory('/app', ['src']);
      fs.addFile('/app/package.json', '{}');
      const results = await fs.listFiles('/app', '');
      expect(results.some((f) => f.type === 'directory')).toBe(true);
      expect(results.some((f) => f.type === 'file')).toBe(true);
    });

    it('filters by pattern', async () => {
      const fs = new FakeFilesystemService();
      fs.addFile('/app/index.ts', '');
      fs.addFile('/app/utils.ts', '');
      const results = await fs.listFiles('/app', 'index');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('index.ts');
    });

    it('returns empty for unmatched pattern', async () => {
      const fs = new FakeFilesystemService();
      fs.addFile('/app/index.ts', '');
      expect(await fs.listFiles('/app', 'nonexistent')).toEqual([]);
    });
  });

  describe('readFile', () => {
    it('reads an existing file', async () => {
      const fs = new FakeFilesystemService();
      fs.addFile('/app/index.ts', 'export {}');
      expect(await fs.readFile('/app', 'index.ts')).toEqual({ content: 'export {}' });
    });

    it('returns error for non-existent file', async () => {
      const fs = new FakeFilesystemService();
      expect(await fs.readFile('/app', 'nope.ts')).toEqual({ error: 'File not found: nope.ts' });
    });
  });

  describe('reset', () => {
    it('clears all state', async () => {
      const fs = new FakeFilesystemService();
      fs.setRoots(['/projects']);
      fs.addDirectory('/projects', ['app']);
      fs.addFile('/projects/app/index.ts', '');
      fs.reset();
      expect(await fs.browseDirectories()).toEqual([]);
      expect(await fs.browseDirectories('/projects')).toEqual([]);
      expect(await fs.readFile('/projects/app', 'index.ts')).toEqual({
        error: 'File not found: index.ts',
      });
    });
  });
});
