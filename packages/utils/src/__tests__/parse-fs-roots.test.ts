import os from 'node:os';
import { describe, expect, it } from 'vitest';
import { parseFsRoots } from '../parse-fs-roots.ts';

describe('parseFsRoots', () => {
  it('defaults to os.homedir() when undefined', () => {
    expect(parseFsRoots(undefined)).toEqual([os.homedir()]);
  });

  it('defaults to os.homedir() when empty string', () => {
    expect(parseFsRoots('')).toEqual([os.homedir()]);
  });

  it('splits comma-separated roots and trims whitespace', () => {
    expect(parseFsRoots('/a, /b , /c')).toEqual(['/a', '/b', '/c']);
  });

  it('ignores empty entries', () => {
    expect(parseFsRoots('/a,, ,/b')).toEqual(['/a', '/b']);
  });

  it('defaults to os.homedir() when all entries are empty', () => {
    expect(parseFsRoots(', , ')).toEqual([os.homedir()]);
  });
});
