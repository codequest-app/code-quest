import { describe, expect, it } from 'vitest';
import { loadConfig, parseBool, resolveSqlitePath } from '../config.ts';

describe('resolveSqlitePath', () => {
  it('strips file: prefix', () => {
    expect(resolveSqlitePath('file:./data/code-quest.db')).toBe('./data/code-quest.db');
  });

  it('strips file: prefix for absolute paths', () => {
    expect(resolveSqlitePath('file:/var/app.db')).toBe('/var/app.db');
  });

  it('maps file::memory: to :memory:', () => {
    expect(resolveSqlitePath('file::memory:')).toBe(':memory:');
  });

  it('passes bare paths through (loose parser)', () => {
    expect(resolveSqlitePath('./data/code-quest.db')).toBe('./data/code-quest.db');
    expect(resolveSqlitePath('/var/app.db')).toBe('/var/app.db');
  });
});

describe('parseBool', () => {
  it('returns default when raw is undefined', () => {
    expect(parseBool(undefined, false)).toBe(false);
    expect(parseBool(undefined, true)).toBe(true);
  });

  it('returns true for "true" and "1"', () => {
    expect(parseBool('true', false)).toBe(true);
    expect(parseBool('1', false)).toBe(true);
  });

  it('returns false for "false" and "0"', () => {
    expect(parseBool('false', true)).toBe(false);
    expect(parseBool('0', true)).toBe(false);
  });

  it('returns false for unrecognized values', () => {
    expect(parseBool('yes', false)).toBe(false);
    expect(parseBool('', false)).toBe(false);
  });
});

describe('loadConfig — database URLs', () => {
  it('empty env → single sqlite default', () => {
    expect(loadConfig({}).database).toEqual(['file:./data/code-quest.db']);
  });

  it('only DATABASE_SQLITE_URL set → single entry', () => {
    expect(loadConfig({ DATABASE_SQLITE_URL: 'file:./data/app.db' }).database).toEqual([
      'file:./data/app.db',
    ]);
  });

  it('only DATABASE_URL set (mysql) → primary first, sqlite default second', () => {
    expect(loadConfig({ DATABASE_URL: 'mysql://root@localhost/db' }).database).toEqual([
      'mysql://root@localhost/db',
      'file:./data/code-quest.db',
    ]);
  });

  it('both set → DATABASE_URL first, DATABASE_SQLITE_URL second', () => {
    expect(
      loadConfig({
        DATABASE_URL: 'mysql://root@localhost/db',
        DATABASE_SQLITE_URL: 'file:./custom.db',
      }).database,
    ).toEqual(['mysql://root@localhost/db', 'file:./custom.db']);
  });

  it('DATABASE_URL same as sqlite → no duplicate', () => {
    expect(loadConfig({ DATABASE_URL: 'file:./data/code-quest.db' }).database).toEqual([
      'file:./data/code-quest.db',
    ]);
  });

  it('empty strings fall back to single default', () => {
    expect(loadConfig({ DATABASE_URL: '', DATABASE_SQLITE_URL: '' }).database).toEqual([
      'file:./data/code-quest.db',
    ]);
  });
});

describe('loadConfig — non-database envs', () => {
  it('reads all new env names', () => {
    const c = loadConfig({
      APP_PORT: '4242',
      CLI_SYSTEM_PROMPT: 'sys',
      CLI_AUTO_MODE: 'false',
      CLI_BYPASS_PERMISSIONS: 'false',
      EXPLORER_ROOTS: '/tmp/a,/tmp/b',
    });
    expect(c.port).toBe(4242);
    expect(c.systemPrompt).toBe('sys');
    expect(c.autoMode).toBe(false);
    expect(c.allowDangerouslySkipPermissions).toBe(false);
    expect(c.fsRoots).toEqual(['/tmp/a', '/tmp/b']);
  });

  it('empty env — defaults apply', () => {
    const c = loadConfig({});
    expect(c.port).toBe(3000);
    expect(c.rawEvents.writeDeltas).toBe(false);
    expect(c.rawEvents.readDeltas).toBe(false);
    expect(c.autoMode).toBe(true);
    expect(c.allowDangerouslySkipPermissions).toBe(true);
    expect(c.systemPrompt).toBe('');
  });

  it('RAW_EVENTS_WRITE_DELTAS=true enables delta writes (only)', () => {
    const c = loadConfig({ RAW_EVENTS_WRITE_DELTAS: 'true' });
    expect(c.rawEvents.writeDeltas).toBe(true);
    expect(c.rawEvents.readDeltas).toBe(false);
  });

  it('RAW_EVENTS_READ_DELTAS=true enables UNION reads (only)', () => {
    const c = loadConfig({ RAW_EVENTS_READ_DELTAS: 'true' });
    expect(c.rawEvents.writeDeltas).toBe(false);
    expect(c.rawEvents.readDeltas).toBe(true);
  });

  it('both flags independently true', () => {
    const c = loadConfig({
      RAW_EVENTS_WRITE_DELTAS: 'true',
      RAW_EVENTS_READ_DELTAS: 'true',
    });
    expect(c.rawEvents.writeDeltas).toBe(true);
    expect(c.rawEvents.readDeltas).toBe(true);
  });

  it('accepts "1" as true for both flags', () => {
    const c = loadConfig({ RAW_EVENTS_WRITE_DELTAS: '1', RAW_EVENTS_READ_DELTAS: '1' });
    expect(c.rawEvents.writeDeltas).toBe(true);
    expect(c.rawEvents.readDeltas).toBe(true);
  });

  it('CLI_THINKING_DISPLAY unset → summarized', () => {
    expect(loadConfig({}).thinkingDisplay).toBe('summarized');
  });

  it('CLI_THINKING_DISPLAY=summarized → summarized', () => {
    expect(loadConfig({ CLI_THINKING_DISPLAY: 'summarized' }).thinkingDisplay).toBe('summarized');
  });

  it('CLI_THINKING_DISPLAY=omitted → omitted', () => {
    expect(loadConfig({ CLI_THINKING_DISPLAY: 'omitted' }).thinkingDisplay).toBe('omitted');
  });

  it('CLI_THINKING_DISPLAY=garbage → falls back to summarized', () => {
    expect(loadConfig({ CLI_THINKING_DISPLAY: 'bogus' }).thinkingDisplay).toBe('summarized');
  });

  describe('summoner', () => {
    it('default mode is remote', () => {
      const c = loadConfig({});
      expect(c.summonerMode).toBe('remote');
    });

    it('SUMMONER_MODE=local → local mode', () => {
      const c = loadConfig({ SUMMONER_MODE: 'local' });
      expect(c.summonerMode).toBe('local');
    });

    it('uses SUMMONER_TOKEN when set', () => {
      const c = loadConfig({ SUMMONER_TOKEN: 'my-secret' });
      expect(c.summonerToken).toBe('my-secret');
      expect(c.summonerTokenGenerated).toBe(false);
    });

    it('generates a random token when SUMMONER_TOKEN is empty and mode is remote', () => {
      const c = loadConfig({});
      expect(c.summonerToken).toBeDefined();
      expect(c.summonerToken!.length).toBeGreaterThan(0);
      expect(c.summonerTokenGenerated).toBe(true);
    });

    it('generates different tokens on each call', () => {
      const c1 = loadConfig({});
      const c2 = loadConfig({});
      expect(c1.summonerToken).not.toBe(c2.summonerToken);
    });

    it('summonerToken is undefined when mode is local', () => {
      const c = loadConfig({ SUMMONER_MODE: 'local' });
      expect(c.summonerToken).toBeUndefined();
      expect(c.summonerTokenGenerated).toBe(false);
    });
  });

  describe('TRANSPORT', () => {
    it('default (unset) → ws only', () => {
      expect(loadConfig({}).transport).toEqual({ ws: true, socketio: false });
    });

    it('TRANSPORT=ws → ws only', () => {
      expect(loadConfig({ TRANSPORT: 'ws' }).transport).toEqual({ ws: true, socketio: false });
    });

    it('TRANSPORT=socketio → socket.io only', () => {
      expect(loadConfig({ TRANSPORT: 'socketio' }).transport).toEqual({
        ws: false,
        socketio: true,
      });
    });

    it('TRANSPORT=both → both enabled', () => {
      expect(loadConfig({ TRANSPORT: 'both' }).transport).toEqual({ ws: true, socketio: true });
    });

    it('TRANSPORT=garbage → falls back to ws default', () => {
      expect(loadConfig({ TRANSPORT: 'bogus' }).transport).toEqual({ ws: true, socketio: false });
    });
  });
});
