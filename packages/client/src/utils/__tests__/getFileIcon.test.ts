import { describe, expect, it } from 'vitest';
import { getFileIcon } from '../getFileIcon.ts';

describe('getFileIcon', () => {
  describe('extension match', () => {
    it.each([
      ['foo.ts', 'material-icon-theme:typescript'],
      ['foo.tsx', 'material-icon-theme:react_ts'],
      ['foo.js', 'material-icon-theme:javascript'],
      ['foo.jsx', 'material-icon-theme:react'],
      ['foo.json', 'material-icon-theme:json'],
      ['foo.md', 'material-icon-theme:markdown'],
      ['foo.css', 'material-icon-theme:css'],
      ['foo.svg', 'material-icon-theme:svg'],
      ['foo.png', 'material-icon-theme:image'],
    ])('%s → %s', (name, expected) => {
      expect(getFileIcon(name)).toBe(expected);
    });
  });

  describe('filename match wins over extension', () => {
    it.each([
      ['package.json', 'material-icon-theme:nodejs'],
      ['tsconfig.json', 'material-icon-theme:tsconfig'],
      ['Dockerfile', 'material-icon-theme:docker'],
      ['.gitignore', 'material-icon-theme:git'],
      ['README.md', 'material-icon-theme:readme'],
    ])('%s → %s', (name, expected) => {
      expect(getFileIcon(name)).toBe(expected);
    });
  });

  it('extension match is case-insensitive', () => {
    expect(getFileIcon('FOO.TS')).toBe('material-icon-theme:typescript');
    expect(getFileIcon('Readme.MD')).toBe('material-icon-theme:readme');
  });

  it('unknown extension falls back to generic', () => {
    expect(getFileIcon('mystery.xyz')).toBe('material-icon-theme:file');
  });

  it('no extension falls back to generic', () => {
    expect(getFileIcon('Makefile')).toBe('material-icon-theme:file');
  });
});
