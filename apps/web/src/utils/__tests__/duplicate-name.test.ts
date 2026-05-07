import { describe, expect, it } from 'vitest';
import { nextDuplicateName } from '@/utils/duplicate-name';

describe('nextDuplicateName', () => {
  it('appends " copy" before the extension', () => {
    expect(nextDuplicateName(['foo.ts'], 'foo.ts')).toBe('foo copy.ts');
  });

  it('handles dotless filenames', () => {
    expect(nextDuplicateName(['Makefile'], 'Makefile')).toBe('Makefile copy');
  });

  it('increments numeric suffix when copy already exists', () => {
    expect(nextDuplicateName(['foo.ts', 'foo copy.ts'], 'foo.ts')).toBe('foo copy 2.ts');
    expect(nextDuplicateName(['foo.ts', 'foo copy.ts', 'foo copy 2.ts'], 'foo.ts')).toBe(
      'foo copy 3.ts',
    );
  });

  it('skips already-taken numeric suffixes', () => {
    expect(nextDuplicateName(['foo.ts', 'foo copy.ts', 'foo copy 5.ts'], 'foo.ts')).toBe(
      'foo copy 2.ts',
    );
  });

  it('treats multi-dot extension as single ext (.tar.gz → .gz)', () => {
    expect(nextDuplicateName(['foo.tar.gz'], 'foo.tar.gz')).toBe('foo.tar copy.gz');
  });
});
