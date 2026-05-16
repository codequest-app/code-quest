import { describe, expect, it } from 'vitest';
import { validateBranchName } from '../validate-branch-name.ts';
import { validateWorktreeName } from '../validate-worktree-name.ts';

describe('validateBranchName', () => {
  it('returns null for valid branch name', () => {
    expect(validateBranchName('feature/my-branch')).toBeNull();
  });

  it('errors on empty name', () => {
    expect(validateBranchName('')).toBeTruthy();
  });

  it('errors on path traversal', () => {
    expect(validateBranchName('bad/../branch')).toBeTruthy();
  });

  it('errors on name ending with .lock', () => {
    expect(validateBranchName('branch.lock')).toBeTruthy();
  });
});

describe('validateWorktreeName', () => {
  it('returns null for valid worktree name', () => {
    expect(validateWorktreeName('my-worktree')).toBeNull();
  });

  it('errors on empty name', () => {
    expect(validateWorktreeName('')).toBeTruthy();
  });

  it('errors on slash (not allowed in worktree names)', () => {
    expect(validateWorktreeName('bad/slash')).toBeTruthy();
  });

  it('errors on name over 100 chars', () => {
    expect(validateWorktreeName('a'.repeat(101))).toBeTruthy();
  });
});
