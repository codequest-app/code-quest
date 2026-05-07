import os from 'node:os';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../config.ts';

describe('loadConfig', () => {
  describe('server', () => {
    it('reads from CLI args --server', () => {
      const config = loadConfig({
        argv: ['--server', 'ws://localhost:3000/summoner'],
      });
      expect(config.server).toBe('ws://localhost:3000/summoner');
    });

    it('falls back to REMOTE_SERVER env', () => {
      const config = loadConfig({
        env: { REMOTE_SERVER: 'ws://env:3000/summoner' },
      });
      expect(config.server).toBe('ws://env:3000/summoner');
    });

    it('CLI args take precedence over env', () => {
      const config = loadConfig({
        argv: ['--server', 'ws://cli:3000'],
        env: { REMOTE_SERVER: 'ws://env:3000' },
      });
      expect(config.server).toBe('ws://cli:3000');
    });

    it('returns undefined when not provided', () => {
      expect(loadConfig({}).server).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      expect(loadConfig({ env: { REMOTE_SERVER: '  ' } }).server).toBeUndefined();
    });
  });

  describe('token', () => {
    it('reads from CLI args --token', () => {
      const config = loadConfig({
        argv: ['--token', 'my-token'],
      });
      expect(config.token).toBe('my-token');
    });

    it('falls back to REMOTE_TOKEN env', () => {
      const config = loadConfig({
        env: { REMOTE_TOKEN: 'env-token' },
      });
      expect(config.token).toBe('env-token');
    });

    it('returns undefined when not provided', () => {
      expect(loadConfig({}).token).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      expect(loadConfig({ env: { REMOTE_TOKEN: '' } }).token).toBeUndefined();
    });
  });

  describe('fsRoots', () => {
    it('reads from EXPLORER_ROOTS env', () => {
      const config = loadConfig({ env: { EXPLORER_ROOTS: '/a, /b' } });
      expect(config.fsRoots).toEqual(['/a', '/b']);
    });

    it('defaults to os.homedir()', () => {
      expect(loadConfig({}).fsRoots).toEqual([os.homedir()]);
    });

    it('ignores empty entries', () => {
      const config = loadConfig({ env: { EXPLORER_ROOTS: '/a,, ,/b' } });
      expect(config.fsRoots).toEqual(['/a', '/b']);
    });
  });
});
