import type { WorktreeInfo } from '@code-quest/shared';
import { describe, expect, it } from 'vitest';
import { findWorktreeByCwd } from '../findWorktreeByCwd';

const wt = (name: string, path: string, branch?: string): WorktreeInfo => ({
  name,
  path,
  branch,
});

describe('findWorktreeByCwd', () => {
  it('returns null when cwd is undefined', () => {
    expect(findWorktreeByCwd({}, undefined)).toBeNull();
  });

  it('returns null when no project listing matches', () => {
    const listing = { '/a': [wt('main', '/a', 'main')] };
    expect(findWorktreeByCwd(listing, '/other')).toBeNull();
  });

  it('skips "not_a_repo" entries', () => {
    const listing = {
      '/a': 'not_a_repo' as const,
      '/b': [wt('main', '/b/x', 'main')],
    };
    expect(findWorktreeByCwd(listing, '/b/x')).toEqual({
      worktree: wt('main', '/b/x', 'main'),
      projectCwd: '/b',
    });
  });

  it('finds worktree in nested project listing', () => {
    const listing = {
      '/repo': [
        wt('main', '/repo', 'main'),
        wt('feat-x', '/repo/.claude/worktrees/feat-x', 'feat-x'),
      ],
    };
    const hit = findWorktreeByCwd(listing, '/repo/.claude/worktrees/feat-x');
    expect(hit?.projectCwd).toBe('/repo');
    expect(hit?.worktree.branch).toBe('feat-x');
  });

  it('returns first match across projects', () => {
    const listing = {
      '/a': [wt('main', '/a', 'main')],
      '/b': [wt('main', '/b', 'main')],
    };
    expect(findWorktreeByCwd(listing, '/b')?.projectCwd).toBe('/b');
  });
});
