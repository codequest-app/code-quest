import { describe, expect, it } from 'vitest';
import { autoDerivePath, branchToSlug, buildWorktreeCommand } from '../worktree-dialog-helpers';

describe('branchToSlug', () => {
  it('takes last segment of a path-style branch', () => {
    expect(branchToSlug('feature/my-thing')).toBe('my-thing');
  });

  it('replaces special chars with dash', () => {
    expect(branchToSlug('fix&stuff')).toBe('fix-stuff');
  });

  it('trims leading/trailing dashes', () => {
    expect(branchToSlug('---x---')).toBe('x');
  });
});

describe('autoDerivePath', () => {
  it('uses <projectCwd>/.claude/worktrees/<slug> (claude-code convention)', () => {
    expect(autoDerivePath('/Users/me/repos/cc-office', 'feature/x')).toBe(
      '/Users/me/repos/cc-office/.claude/worktrees/x',
    );
  });

  it('falls back when branch empty', () => {
    expect(autoDerivePath('/repos/foo', '')).toBe('/repos/foo/.claude/worktrees/worktree');
  });
});

describe('buildWorktreeCommand', () => {
  it('existing mode: plain add', () => {
    expect(
      buildWorktreeCommand({
        mode: 'existing',
        branch: 'main',
        path: '/repo/.claude/worktrees/main',
      }),
    ).toBe('git worktree add /repo/.claude/worktrees/main main');
  });

  it('new mode: -b + base', () => {
    expect(
      buildWorktreeCommand({
        mode: 'new',
        branch: 'feat/x',
        baseBranch: 'develop',
        path: '/repo/.claude/worktrees/x',
      }),
    ).toBe('git worktree add -b feat/x /repo/.claude/worktrees/x develop');
  });

  it('new mode: defaults base to main when omitted', () => {
    expect(
      buildWorktreeCommand({
        mode: 'new',
        branch: 'feat/x',
        path: '/repo/.claude/worktrees/x',
      }),
    ).toBe('git worktree add -b feat/x /repo/.claude/worktrees/x main');
  });

  it('placeholders when inputs empty', () => {
    expect(buildWorktreeCommand({ mode: 'existing', branch: '', path: '' })).toBe(
      'git worktree add <path> <branch>',
    );
    expect(buildWorktreeCommand({ mode: 'new', branch: '', path: '' })).toBe(
      'git worktree add -b <branch> <path> main',
    );
  });
});
