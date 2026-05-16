import { FakeFilesystemService, FakeGitService, FakeWatchService } from '@code-quest/test-kit';
import { describe, expect, it, vi } from 'vitest';
import { FilesDataSource } from '../data-sources/files-data-source.ts';
import { GitDataSource } from '../data-sources/git-data-source.ts';
import {
  OpenspecDataSource,
  type OpenspecServiceLike,
} from '../data-sources/openspec-data-source.ts';

function makeFakeOpenspec(): OpenspecServiceLike {
  return {
    list: vi.fn(async () => ({ changes: [], specs: [] })),
  };
}

// ── FilesDataSource ──

describe('FilesDataSource', () => {
  it('read() returns files from filesystem service', async () => {
    const watch = new FakeWatchService();
    const fs = new FakeFilesystemService();
    fs.setRoots(['/repo']);
    fs.addFile('/repo/foo.ts', '');
    const ds = new FilesDataSource('/repo', watch, fs);
    const result = await ds.read();
    expect(result).toHaveLength(1);
    expect(result[0]?.path).toBe('foo.ts');
  });

  it('notifies onChange when a regular file changes', () => {
    const watch = new FakeWatchService();
    const ds = new FilesDataSource('/repo', watch, new FakeFilesystemService());
    const cb = vi.fn();
    ds.onChange(cb);
    watch.simulate('/repo', { type: 'change', path: 'src/foo.ts' });
    expect(cb).toHaveBeenCalledOnce();
  });

  it('does NOT notify onChange for .git/HEAD changes', () => {
    const watch = new FakeWatchService();
    const ds = new FilesDataSource('/repo', watch, new FakeFilesystemService());
    const cb = vi.fn();
    ds.onChange(cb);
    watch.simulate('/repo', { type: 'change', path: '.git/HEAD' });
    expect(cb).not.toHaveBeenCalled();
  });

  it('does NOT notify onChange for node_modules changes', () => {
    const watch = new FakeWatchService();
    const ds = new FilesDataSource('/repo', watch, new FakeFilesystemService());
    const cb = vi.fn();
    ds.onChange(cb);
    watch.simulate('/repo', { type: 'change', path: 'node_modules/pkg/index.js' });
    expect(cb).not.toHaveBeenCalled();
  });

  it('does NOT notify onChange for dist changes', () => {
    const watch = new FakeWatchService();
    const ds = new FilesDataSource('/repo', watch, new FakeFilesystemService());
    const cb = vi.fn();
    ds.onChange(cb);
    watch.simulate('/repo', { type: 'change', path: 'dist/bundle.js' });
    expect(cb).not.toHaveBeenCalled();
  });

  it('unsubscribed onChange listener stops receiving callbacks', () => {
    const watch = new FakeWatchService();
    const ds = new FilesDataSource('/repo', watch, new FakeFilesystemService());
    const cb = vi.fn();
    const off = ds.onChange(cb);
    off();
    watch.simulate('/repo', { type: 'change', path: 'src/foo.ts' });
    expect(cb).not.toHaveBeenCalled();
  });
});

// ── GitDataSource ──

describe('GitDataSource', () => {
  it('read() returns git status', async () => {
    const watch = new FakeWatchService();
    const git = new FakeGitService();
    git.setBranch('feature/x');
    git.setClean(false);
    const ds = new GitDataSource('/repo', watch, git);
    const result = await ds.read();
    expect(result.branch).toBe('feature/x');
    expect(result.isClean).toBe(false);
  });

  it('notifies onChange for .git/HEAD change', () => {
    const watch = new FakeWatchService();
    const ds = new GitDataSource('/repo', watch, new FakeGitService());
    const cb = vi.fn();
    ds.onChange(cb);
    watch.simulate('/repo', { type: 'change', path: '.git/HEAD' });
    expect(cb).toHaveBeenCalledOnce();
  });

  it('notifies onChange for .git/index change', () => {
    const watch = new FakeWatchService();
    const ds = new GitDataSource('/repo', watch, new FakeGitService());
    const cb = vi.fn();
    ds.onChange(cb);
    watch.simulate('/repo', { type: 'change', path: '.git/index' });
    expect(cb).toHaveBeenCalledOnce();
  });

  it('notifies onChange for .git/refs/heads/main change', () => {
    const watch = new FakeWatchService();
    const ds = new GitDataSource('/repo', watch, new FakeGitService());
    const cb = vi.fn();
    ds.onChange(cb);
    watch.simulate('/repo', { type: 'change', path: '.git/refs/heads/main' });
    expect(cb).toHaveBeenCalledOnce();
  });

  it('does NOT notify onChange for regular file changes', () => {
    const watch = new FakeWatchService();
    const ds = new GitDataSource('/repo', watch, new FakeGitService());
    const cb = vi.fn();
    ds.onChange(cb);
    watch.simulate('/repo', { type: 'change', path: 'src/foo.ts' });
    expect(cb).not.toHaveBeenCalled();
  });

  it('does NOT notify onChange for .git/objects changes', () => {
    const watch = new FakeWatchService();
    const ds = new GitDataSource('/repo', watch, new FakeGitService());
    const cb = vi.fn();
    ds.onChange(cb);
    watch.simulate('/repo', { type: 'change', path: '.git/objects/ab/cdef' });
    expect(cb).not.toHaveBeenCalled();
  });
});

// ── OpenspecDataSource ──

describe('OpenspecDataSource', () => {
  it('read() returns openspec list', async () => {
    const watch = new FakeWatchService();
    const openspec = {
      list: vi.fn(async () => ({
        changes: [{ name: 'my-change', tasks: null, status: 'in-progress' as const }],
        specs: [],
      })),
    };
    const ds = new OpenspecDataSource('/repo', watch, openspec);
    const result = await ds.read();
    if (!('changes' in result)) throw new Error('unexpected error result');
    expect(result.changes).toHaveLength(1);
  });

  it('notifies onChange for openspec/ file changes', () => {
    const watch = new FakeWatchService();
    const ds = new OpenspecDataSource('/repo', watch, makeFakeOpenspec());
    const cb = vi.fn();
    ds.onChange(cb);
    watch.simulate('/repo', { type: 'change', path: 'openspec/changes/foo/design.md' });
    expect(cb).toHaveBeenCalledOnce();
  });

  it('does NOT notify onChange for non-openspec file changes', () => {
    const watch = new FakeWatchService();
    const ds = new OpenspecDataSource('/repo', watch, makeFakeOpenspec());
    const cb = vi.fn();
    ds.onChange(cb);
    watch.simulate('/repo', { type: 'change', path: 'src/foo.ts' });
    expect(cb).not.toHaveBeenCalled();
  });
});
