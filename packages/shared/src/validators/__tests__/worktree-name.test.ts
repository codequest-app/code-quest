import { describe, expect, it } from 'vitest';
import { validateWorktreeName } from '../worktree-name.ts';

describe('validateWorktreeName', () => {
  it('accepts simple names', () => {
    expect(validateWorktreeName('feature-x')).toBeNull();
    expect(validateWorktreeName('feat_1.0')).toBeNull();
    expect(validateWorktreeName('abc')).toBeNull();
  });

  it('rejects empty name', () => {
    expect(validateWorktreeName('')).toMatch(/required/i);
  });

  it('rejects invalid characters', () => {
    expect(validateWorktreeName('has space')).toMatch(/letters, numbers/i);
    expect(validateWorktreeName('foo/bar')).toMatch(/letters, numbers/i);
    expect(validateWorktreeName('foo@bar')).toMatch(/letters, numbers/i);
  });

  it('rejects path-traversal segments', () => {
    // Note: regex allows only `[A-Za-z0-9._-]+`, which excludes `/` so "../x" is already blocked
    // by char class; but `foo..bar` passes chars and must be caught by the `..` guard.
    expect(validateWorktreeName('foo..bar')).toMatch(/\.\./);
  });

  it('rejects names ending with dot or .lock', () => {
    expect(validateWorktreeName('foo.')).toMatch(/end with/i);
    expect(validateWorktreeName('foo.lock')).toMatch(/end with/i);
  });

  it('rejects over-long names', () => {
    expect(validateWorktreeName('a'.repeat(101))).toMatch(/100 characters/);
  });

  it('accepts exactly 100-char name', () => {
    expect(validateWorktreeName('a'.repeat(100))).toBeNull();
  });
});
