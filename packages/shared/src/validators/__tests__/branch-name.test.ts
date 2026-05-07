import { describe, expect, it } from 'vitest';
import { validateBranchName } from '../branch-name.ts';

describe('validateBranchName', () => {
  it('accepts simple names', () => {
    expect(validateBranchName('main')).toBeNull();
    expect(validateBranchName('feature-x')).toBeNull();
    expect(validateBranchName('feat_1.0')).toBeNull();
  });

  it('accepts names with slashes', () => {
    expect(validateBranchName('feature/foo')).toBeNull();
    expect(validateBranchName('user/feat/bar')).toBeNull();
  });

  it('rejects empty name', () => {
    expect(validateBranchName('')).toMatch(/required/i);
  });

  it('rejects invalid characters', () => {
    expect(validateBranchName('has space')).toMatch(/allowed/i);
    expect(validateBranchName('foo@bar')).toMatch(/allowed/i);
    expect(validateBranchName('foo:bar')).toMatch(/allowed/i);
  });

  it('rejects path-traversal segments', () => {
    expect(validateBranchName('foo/../bar')).toMatch(/\.\./);
    expect(validateBranchName('foo..bar')).toMatch(/\.\./);
  });

  it('rejects names ending with dot or .lock', () => {
    expect(validateBranchName('foo.')).toMatch(/end with/i);
    expect(validateBranchName('foo.lock')).toMatch(/end with/i);
  });

  it('rejects over-long names', () => {
    expect(validateBranchName('a'.repeat(256))).toMatch(/255 characters/);
  });

  it('accepts exactly 255-char name', () => {
    expect(validateBranchName('a'.repeat(255))).toBeNull();
  });
});
