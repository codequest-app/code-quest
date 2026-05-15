import { PathOutsideRootsError } from '@code-quest/shared';
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

    it('throws PathOutsideRootsError for path outside roots', async () => {
      const fs = new FakeFilesystemService();
      fs.setRoots(['/projects']);
      await expect(fs.browseDirectories('/unknown')).rejects.toThrow(PathOutsideRootsError);
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

  describe('browseEntries', () => {
    it('returns sorted directories and files at a path', async () => {
      const fs = new FakeFilesystemService();
      fs.setRoots(['/repo']);
      fs.addDirectory('/repo', ['src']);
      fs.addFile('/repo/README.md', '# hi');
      fs.addFile('/repo/package.json', '{}');
      const result = await fs.browseEntries('/repo');
      expect(result.directories).toEqual([{ name: 'src', path: '/repo/src' }]);
      expect(result.files).toEqual([
        { name: 'package.json', path: '/repo/package.json' },
        { name: 'README.md', path: '/repo/README.md' },
      ]);
    });

    it('returns roots as directories with empty files when no path', async () => {
      const fs = new FakeFilesystemService();
      fs.setRoots(['/repo']);
      const result = await fs.browseEntries();
      expect(result.directories).toEqual([{ name: 'repo', path: '/repo' }]);
      expect(result.files).toEqual([]);
    });

    it('throws PathOutsideRootsError for path outside roots', async () => {
      const fs = new FakeFilesystemService();
      fs.setRoots(['/repo']);
      await expect(fs.browseEntries('/unknown')).rejects.toThrow(PathOutsideRootsError);
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
      expect(results[0]!.name).toBe('index.ts');
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
      await expect(fs.browseDirectories('/projects')).rejects.toThrow(PathOutsideRootsError);
    });
  });

  describe('fromTree', () => {
    it('sets root from first argument', async () => {
      const fs = new FakeFilesystemService();
      fs.fromTree('/projects', {});
      expect(await fs.browseDirectories()).toEqual([{ name: 'projects', path: '/projects' }]);
    });

    it('creates nested directories', async () => {
      const fs = new FakeFilesystemService();
      fs.fromTree('/projects', { app: {}, blog: {} });
      expect(await fs.browseDirectories('/projects')).toEqual([
        { name: 'app', path: '/projects/app' },
        { name: 'blog', path: '/projects/blog' },
      ]);
    });

    it('creates files with content', async () => {
      const fs = new FakeFilesystemService();
      fs.fromTree('/root', { 'readme.md': '# Hello' });
      const result = await fs.readFileAbsolute('/root/readme.md');
      expect(result).toMatchObject({ content: '# Hello' });
    });

    it('creates deeply nested structure', async () => {
      const fs = new FakeFilesystemService();
      fs.fromTree('/repo', {
        openspec: {
          changes: {
            'add-foo': {
              'tasks.md': '- [ ] task',
            },
          },
        },
      });
      const result = await fs.readFileAbsolute('/repo/openspec/changes/add-foo/tasks.md');
      expect(result).toMatchObject({ content: '- [ ] task' });
    });

    it('accumulates roots when called multiple times', async () => {
      const fs = new FakeFilesystemService();
      fs.fromTree('/a', {});
      fs.fromTree('/b', {});
      const roots = await fs.browseDirectories();
      expect(roots).toEqual(
        expect.arrayContaining([
          { name: 'a', path: '/a' },
          { name: 'b', path: '/b' },
        ]),
      );
    });
  });

  describe('mutations (create / delete / rename / copy / move)', () => {
    function setup() {
      const fs = new FakeFilesystemService();
      fs.setRoots(['/repo']);
      fs.addDirectory('/repo', ['src']);
      fs.addDirectory('/repo/src', []);
      fs.addFile('/repo/foo.ts', 'export const foo = 1;\n');
      fs.addFile('/repo/src/inner.ts', 'inner');
      return fs;
    }

    describe('create', () => {
      it('creates an empty file at a new path', async () => {
        const fs = setup();
        expect(await fs.create('/repo/new.ts', 'file')).toEqual({ ok: true });
        expect(await fs.readFileAbsolute('/repo/new.ts')).toMatchObject({ content: '' });
      });

      it('creates a directory at a new path', async () => {
        const fs = setup();
        expect(await fs.create('/repo/new-dir', 'directory')).toEqual({ ok: true });
        expect(await fs.statKind('/repo/new-dir')).toBe('directory');
      });

      it('rejects existing file', async () => {
        const fs = setup();
        expect(await fs.create('/repo/foo.ts', 'file')).toEqual({ error: 'exists' });
      });

      it('throws PathOutsideRootsError for path outside allowed roots', async () => {
        const fs = setup();
        await expect(fs.create('/etc/passwd', 'file')).rejects.toThrow(PathOutsideRootsError);
      });
    });

    describe('delete', () => {
      it('deletes a file', async () => {
        const fs = setup();
        expect(await fs.delete('/repo/foo.ts')).toEqual({ ok: true });
        expect(await fs.exists('/repo/foo.ts')).toBe(false);
      });

      it('deletes a directory recursively', async () => {
        const fs = setup();
        expect(await fs.delete('/repo/src')).toEqual({ ok: true });
        expect(await fs.exists('/repo/src/inner.ts')).toBe(false);
      });

      it('throws PathOutsideRootsError for path outside allowed roots', async () => {
        const fs = setup();
        await expect(fs.delete('/etc/passwd')).rejects.toThrow(PathOutsideRootsError);
      });
    });

    describe('rename', () => {
      it('renames a file in same directory', async () => {
        const fs = setup();
        expect(await fs.rename('/repo/foo.ts', '/repo/bar.ts')).toEqual({ ok: true });
        expect(await fs.exists('/repo/foo.ts')).toBe(false);
        expect(await fs.readFileAbsolute('/repo/bar.ts')).toMatchObject({
          content: 'export const foo = 1;\n',
        });
      });

      it('rejects when destination exists', async () => {
        const fs = setup();
        fs.addFile('/repo/bar.ts', 'existing');
        expect(await fs.rename('/repo/foo.ts', '/repo/bar.ts')).toEqual({ error: 'exists' });
      });

      it('throws PathOutsideRootsError for path outside allowed roots', async () => {
        const fs = setup();
        await expect(fs.rename('/repo/foo.ts', '/etc/foo.ts')).rejects.toThrow(
          PathOutsideRootsError,
        );
      });
    });

    describe('copy', () => {
      it('copies a file', async () => {
        const fs = setup();
        expect(await fs.copy('/repo/foo.ts', '/repo/foo-copy.ts')).toEqual({ ok: true });
        expect(await fs.readFileAbsolute('/repo/foo-copy.ts')).toMatchObject({
          content: 'export const foo = 1;\n',
        });
        // Original still there
        expect(await fs.exists('/repo/foo.ts')).toBe(true);
      });

      it('copies a directory recursively', async () => {
        const fs = setup();
        expect(await fs.copy('/repo/src', '/repo/src-copy')).toEqual({ ok: true });
        expect(await fs.readFileAbsolute('/repo/src-copy/inner.ts')).toMatchObject({
          content: 'inner',
        });
      });

      it('rejects when destination exists', async () => {
        const fs = setup();
        expect(await fs.copy('/repo/foo.ts', '/repo/foo.ts')).toEqual({ error: 'exists' });
      });
    });

    describe('move', () => {
      it('moves a file across directories', async () => {
        const fs = setup();
        expect(await fs.move('/repo/foo.ts', '/repo/src/foo.ts')).toEqual({ ok: true });
        expect(await fs.exists('/repo/foo.ts')).toBe(false);
        expect(await fs.readFileAbsolute('/repo/src/foo.ts')).toMatchObject({
          content: 'export const foo = 1;\n',
        });
      });

      it('rejects when destination exists', async () => {
        const fs = setup();
        fs.addFile('/repo/src/foo.ts', 'existing');
        expect(await fs.move('/repo/foo.ts', '/repo/src/foo.ts')).toEqual({ error: 'exists' });
      });

      it('throws PathOutsideRootsError for path outside allowed roots', async () => {
        const fs = setup();
        await expect(fs.move('/repo/foo.ts', '/etc/foo.ts')).rejects.toThrow(PathOutsideRootsError);
      });
    });
  });
});
