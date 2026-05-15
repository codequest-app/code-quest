import { describe, expect, it } from 'vitest';
import { parseLogConfig } from '../log-config.ts';

describe('parseLogConfig', () => {
  it('returns defaults when no env vars set', () => {
    expect(parseLogConfig({})).toEqual({ level: 'info', pretty: false });
  });

  it.each([
    'fatal',
    'error',
    'warn',
    'info',
    'debug',
    'trace',
    'silent',
  ])('accepts valid level %s', (level) => {
    expect(parseLogConfig({ LOG_LEVEL: level })).toEqual({ level, pretty: false });
  });

  it('falls back to info for invalid level', () => {
    expect(parseLogConfig({ LOG_LEVEL: 'verbose' })).toEqual({ level: 'info', pretty: false });
  });

  it('is case-insensitive', () => {
    expect(parseLogConfig({ LOG_LEVEL: 'DEBUG' })).toEqual({ level: 'debug', pretty: false });
  });

  it('trims whitespace', () => {
    expect(parseLogConfig({ LOG_LEVEL: ' warn ' })).toEqual({ level: 'warn', pretty: false });
  });

  it('sets pretty true for "true"', () => {
    expect(parseLogConfig({ LOG_PRETTY: 'true' })).toEqual({ level: 'info', pretty: true });
  });

  it('sets pretty true for "1"', () => {
    expect(parseLogConfig({ LOG_PRETTY: '1' })).toEqual({ level: 'info', pretty: true });
  });

  it('sets pretty false for other values', () => {
    expect(parseLogConfig({ LOG_PRETTY: 'yes' })).toEqual({ level: 'info', pretty: false });
  });
});
