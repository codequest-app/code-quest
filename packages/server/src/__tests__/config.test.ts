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

describe('loadConfig — database URL presence detection', () => {
  it('only DATABASE_URL set → mysql active, sqlite undefined', () => {
    const c = loadConfig({ DATABASE_URL: 'mysql://root@127.0.0.1/db' });
    expect(c.database.url).toBe('mysql://root@127.0.0.1/db');
    expect(c.database.sqliteUrl).toBeUndefined();
  });

  it('only DATABASE_SQLITE_URL set → sqlite active, mysql undefined', () => {
    const c = loadConfig({ DATABASE_SQLITE_URL: 'file:./data/app.db' });
    expect(c.database.sqliteUrl).toBe('file:./data/app.db');
    expect(c.database.url).toBeUndefined();
  });

  it('both set → both populated', () => {
    const c = loadConfig({
      DATABASE_URL: 'mysql://root@127.0.0.1/db',
      DATABASE_SQLITE_URL: 'file:./data/app.db',
    });
    expect(c.database.url).toBe('mysql://root@127.0.0.1/db');
    expect(c.database.sqliteUrl).toBe('file:./data/app.db');
  });

  it('empty env → both undefined (boot-time code throws elsewhere)', () => {
    const c = loadConfig({});
    expect(c.database.url).toBeUndefined();
    expect(c.database.sqliteUrl).toBeUndefined();
  });

  it('empty string values are treated as unset', () => {
    const c = loadConfig({ DATABASE_URL: '', DATABASE_SQLITE_URL: '' });
    expect(c.database.url).toBeUndefined();
    expect(c.database.sqliteUrl).toBeUndefined();
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
});
