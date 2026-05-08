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

    it('falls back to SUMMONER_SERVER env', () => {
      const config = loadConfig({
        env: { SUMMONER_SERVER: 'ws://env:3000/summoner' },
      });
      expect(config.server).toBe('ws://env:3000/summoner');
    });

    it('CLI args take precedence over env', () => {
      const config = loadConfig({
        argv: ['--server', 'ws://cli:3000'],
        env: { SUMMONER_SERVER: 'ws://env:3000' },
      });
      expect(config.server).toBe('ws://cli:3000');
    });

    it('defaults to ws://127.0.0.1:3000/summoner when not provided', () => {
      expect(loadConfig({}).server).toBe('ws://127.0.0.1:3000/summoner');
    });

    it('defaults for empty string', () => {
      expect(loadConfig({ env: { SUMMONER_SERVER: '  ' } }).server).toBe(
        'ws://127.0.0.1:3000/summoner',
      );
    });
  });

  describe('token', () => {
    it('reads from CLI args --token', () => {
      const config = loadConfig({
        argv: ['--token', 'my-token'],
      });
      expect(config.token).toBe('my-token');
    });

    it('falls back to SUMMONER_TOKEN env', () => {
      const config = loadConfig({
        env: { SUMMONER_TOKEN: 'env-token' },
      });
      expect(config.token).toBe('env-token');
    });

    it('returns undefined when not provided', () => {
      expect(loadConfig({}).token).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      expect(loadConfig({ env: { SUMMONER_TOKEN: '' } }).token).toBeUndefined();
    });
  });

  describe('fsRoots', () => {
    it('reads from EXPLORER_ROOTS env', () => {
      const config = loadConfig({ env: { EXPLORER_ROOTS: '/a, /b' } });
      expect(config.fsRoots).toEqual(['/a', '/b']);
    });

    it('reads from --roots CLI arg', () => {
      const config = loadConfig({ argv: ['--roots', '/x,/y'] });
      expect(config.fsRoots).toEqual(['/x', '/y']);
    });

    it('CLI --roots takes precedence over env', () => {
      const config = loadConfig({
        argv: ['--roots', '/cli'],
        env: { EXPLORER_ROOTS: '/env' },
      });
      expect(config.fsRoots).toEqual(['/cli']);
    });

    it('defaults to os.homedir()', () => {
      expect(loadConfig({}).fsRoots).toEqual([os.homedir()]);
    });

    it('ignores empty entries', () => {
      const config = loadConfig({ env: { EXPLORER_ROOTS: '/a,, ,/b' } });
      expect(config.fsRoots).toEqual(['/a', '/b']);
    });
  });

  describe('help', () => {
    it('--help sets showHelp to true', () => {
      const config = loadConfig({ argv: ['--help'] });
      expect(config.showHelp).toBe(true);
    });

    it('defaults showHelp to false', () => {
      expect(loadConfig({}).showHelp).toBe(false);
    });
  });
});
