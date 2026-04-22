import { describe, expect, it } from 'vitest';
import { envBool, loadConfig, parseRawEventsDrivers } from '../config.ts';

describe('parseRawEventsDrivers', () => {
  it('accepts valid drivers', () => {
    expect(parseRawEventsDrivers('sqlite,mysql')).toEqual(['sqlite', 'mysql']);
  });

  it('filters out invalid drivers (including removed "file")', () => {
    expect(parseRawEventsDrivers('sqlite,file,sqllite')).toEqual(['sqlite']);
  });

  it('returns empty array for empty string', () => {
    expect(parseRawEventsDrivers('')).toEqual([]);
  });

  it('trims whitespace', () => {
    expect(parseRawEventsDrivers(' mysql , sqlite ')).toEqual(['mysql', 'sqlite']);
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

describe('loadConfig', () => {
  it('reads all new env names', () => {
    const config = loadConfig({
      APP_PORT: '4242',
      RAW_EVENTS_DRIVERS: 'sqlite,mysql',
      RAW_EVENTS_SQLITE_PATH: '/tmp/app.db',
      CLI_SYSTEM_PROMPT: 'sys',
      CLI_AUTO_MODE: 'false',
      CLI_BYPASS_PERMISSIONS: 'false',
      EXPLORER_ROOTS: '/tmp/a,/tmp/b',
    });
    expect(config.port).toBe(4242);
    expect(config.rawEvents.drivers).toEqual(['sqlite', 'mysql']);
    expect(config.rawEvents.sqlitePath).toBe('/tmp/app.db');
    expect(config.systemPrompt).toBe('sys');
    expect(config.autoMode).toBe(false);
    expect(config.allowDangerouslySkipPermissions).toBe(false);
    expect(config.explorerRoots).toEqual(['/tmp/a', '/tmp/b']);
  });

  it('empty env — defaults apply', () => {
    const config = loadConfig({});
    expect(config.port).toBe(3000);
    expect(config.rawEvents.drivers).toEqual([]);
    expect(config.rawEvents.sqlitePath).toBe('./data/code-quest.db');
    expect(config.rawEvents.persistDeltas).toBe(false);
    expect(config.autoMode).toBe(true);
    expect(config.allowDangerouslySkipPermissions).toBe(true);
    expect(config.systemPrompt).toBe('');
  });

  it('RAW_EVENTS_PERSIST_DELTAS=true enables delta persistence', () => {
    const config = loadConfig({ RAW_EVENTS_PERSIST_DELTAS: 'true' });
    expect(config.rawEvents.persistDeltas).toBe(true);
  });

  it('RAW_EVENTS_PERSIST_DELTAS=1 also enables', () => {
    const config = loadConfig({ RAW_EVENTS_PERSIST_DELTAS: '1' });
    expect(config.rawEvents.persistDeltas).toBe(true);
  });
});
