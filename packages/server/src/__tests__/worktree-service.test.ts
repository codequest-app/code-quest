import { describe, expect, it } from 'vitest';
import { detectWorktree, validateWorktreeName } from '../services/worktree-service.ts';

describe('WorktreeService', () => {
  describe('validateWorktreeName', () => {
    it('accepts valid name with letters, numbers, hyphens', () => {
      expect(() => validateWorktreeName('my-feature-1')).not.toThrow();
    });

    it('accepts name with dots and underscores', () => {
      expect(() => validateWorktreeName('feat.v2_hotfix')).not.toThrow();
    });

    it('rejects empty name', () => {
      expect(() => validateWorktreeName('')).toThrow(/Invalid worktree name/);
    });

    it('rejects name with slashes', () => {
      expect(() => validateWorktreeName('path/to/thing')).toThrow(/only letters/);
    });

    it('rejects name with spaces', () => {
      expect(() => validateWorktreeName('my feature')).toThrow(/only letters/);
    });

    it('rejects name with path traversal', () => {
      expect(() => validateWorktreeName('foo..bar')).toThrow(/must not contain/);
    });

    it('rejects name ending with dot', () => {
      expect(() => validateWorktreeName('feature.')).toThrow(/must not end with/);
    });

    it('rejects name ending with .lock', () => {
      expect(() => validateWorktreeName('branch.lock')).toThrow(/must not end with/);
    });

    it('rejects name exceeding 100 characters', () => {
      expect(() => validateWorktreeName('a'.repeat(101))).toThrow(/100 characters/);
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
});
