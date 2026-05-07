import { describe, expect, it } from 'vitest';
import { matchesFs, matchesGit, matchesOpenspec } from '../../dirty-matchers.ts';

describe('matchesFs', () => {
  it('regular source paths match', () => {
    expect(matchesFs('src/foo.ts')).toBe(true);
    expect(matchesFs('docs/readme.md')).toBe(true);
  });

  it('openspec/* paths match (file tree refresh must also fire)', () => {
    expect(matchesFs('openspec/changes/x/proposal.md')).toBe(true);
    expect(matchesFs('openspec/specs/auth/spec.md')).toBe(true);
  });

  it('.git meta paths do NOT match (those belong to git domain)', () => {
    expect(matchesFs('.git/HEAD')).toBe(false);
    expect(matchesFs('.git/index')).toBe(false);
    expect(matchesFs('.git/refs/heads/main')).toBe(false);
    expect(matchesFs('.git/packed-refs')).toBe(false);
  });

  it('noisy paths ignored', () => {
    expect(matchesFs('node_modules/foo/index.js')).toBe(false);
    expect(matchesFs('.git/objects/ab/cd123')).toBe(false);
    expect(matchesFs('.git/logs/HEAD')).toBe(false);
    expect(matchesFs('dist/bundle.js')).toBe(false);
    expect(matchesFs('build/out')).toBe(false);
    expect(matchesFs('.next/cache/foo')).toBe(false);
    expect(matchesFs('.turbo/run.log')).toBe(false);
    expect(matchesFs('some/path/debug.log')).toBe(false);
    expect(matchesFs('subdir/.DS_Store')).toBe(false);
  });
});

describe('matchesGit', () => {
  it('.git/HEAD, index, packed-refs, refs/* match', () => {
    expect(matchesGit('.git/HEAD')).toBe(true);
    expect(matchesGit('.git/index')).toBe(true);
    expect(matchesGit('.git/packed-refs')).toBe(true);
    expect(matchesGit('.git/refs/heads/main')).toBe(true);
    expect(matchesGit('.git/refs/tags/v1')).toBe(true);
  });

  it('regular files, openspec, objects, logs do NOT match', () => {
    expect(matchesGit('src/foo.ts')).toBe(false);
    expect(matchesGit('openspec/x.md')).toBe(false);
    expect(matchesGit('.git/objects/ab/cd123')).toBe(false);
    expect(matchesGit('.git/logs/HEAD')).toBe(false);
  });
});

describe('matchesOpenspec', () => {
  it('anything under openspec/ matches', () => {
    expect(matchesOpenspec('openspec/changes/x/proposal.md')).toBe(true);
    expect(matchesOpenspec('openspec/specs/auth/spec.md')).toBe(true);
    expect(matchesOpenspec('openspec/AGENTS.md')).toBe(true);
  });

  it('non-openspec paths do NOT match', () => {
    expect(matchesOpenspec('src/foo.ts')).toBe(false);
    expect(matchesOpenspec('.git/HEAD')).toBe(false);
    expect(matchesOpenspec('docs/openspec.md')).toBe(false); // must be AT root
  });
});
