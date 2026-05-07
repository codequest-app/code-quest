import { describe, expect, it } from 'vitest';
import { assertWorktreeName, detectWorktree } from '../worktree.ts';

describe('assertWorktreeName', () => {
  it('accepts valid name', () => {
    expect(() => assertWorktreeName('my-feature-1')).not.toThrow();
    expect(() => assertWorktreeName('feat.v2_hotfix')).not.toThrow();
  });

  it('rejects empty name', () => {
    expect(() => assertWorktreeName('')).toThrow(/Invalid worktree name/);
  });

  it('rejects invalid characters', () => {
    expect(() => assertWorktreeName('path/to/thing')).toThrow(/letters, numbers/i);
    expect(() => assertWorktreeName('my feature')).toThrow(/letters, numbers/i);
  });

  it('rejects path traversal', () => {
    expect(() => assertWorktreeName('foo..bar')).toThrow(/must not contain/);
  });

  it('rejects name ending with dot or .lock', () => {
    expect(() => assertWorktreeName('feature.')).toThrow(/must not end with/);
    expect(() => assertWorktreeName('branch.lock')).toThrow(/must not end with/);
  });

  it('rejects name exceeding 100 characters', () => {
    expect(() => assertWorktreeName('a'.repeat(101))).toThrow(/100 characters/);
  });
});

describe('detectWorktree', () => {
  it('detects worktree path', () => {
    const result = detectWorktree('/repo/.claude/worktrees/my-feature');
    expect(result).toEqual({ name: 'my-feature', path: '/repo/.claude/worktrees/my-feature' });
  });

  it('returns null for non-worktree path', () => {
    expect(detectWorktree('/repo/src/main.ts')).toBeNull();
  });

  it('returns null for repo root', () => {
    expect(detectWorktree('/repo')).toBeNull();
  });
});
