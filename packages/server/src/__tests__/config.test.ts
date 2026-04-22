import { describe, expect, it } from 'vitest';
import { envBool, loadConfig, resolveSqlitePath } from '../config.ts';

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

describe('envBool', () => {
  it('returns default when env var is undefined', () => {
    expect(envBool('NONEXISTENT_VAR')).toBe(false);
    expect(envBool('NONEXISTENT_VAR', true)).toBe(true);
  });

  it('returns true for "true" and "1"', () => {
    expect(envBool('TEST_BOOL', false, 'true')).toBe(true);
    expect(envBool('TEST_BOOL', false, '1')).toBe(true);
  });

  it('returns false for "false" and "0"', () => {
    expect(envBool('TEST_BOOL', true, 'false')).toBe(false);
    expect(envBool('TEST_BOOL', true, '0')).toBe(false);
  });

  it('returns false for unrecognized values', () => {
    expect(envBool('TEST_BOOL', false, 'yes')).toBe(false);
    expect(envBool('TEST_BOOL', false, '')).toBe(false);
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
    expect(c.explorerRoots).toEqual(['/tmp/a', '/tmp/b']);
  });

  it('empty env — defaults apply', () => {
    const c = loadConfig({});
    expect(c.port).toBe(3000);
    expect(c.rawEvents.persistDeltas).toBe(false);
    expect(c.autoMode).toBe(true);
    expect(c.allowDangerouslySkipPermissions).toBe(true);
    expect(c.systemPrompt).toBe('');
  });

  it('RAW_EVENTS_PERSIST_DELTAS=true enables delta persistence', () => {
    expect(loadConfig({ RAW_EVENTS_PERSIST_DELTAS: 'true' }).rawEvents.persistDeltas).toBe(true);
    expect(loadConfig({ RAW_EVENTS_PERSIST_DELTAS: '1' }).rawEvents.persistDeltas).toBe(true);
  });
});
