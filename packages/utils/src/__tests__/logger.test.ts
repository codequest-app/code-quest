import { describe, expect, it } from 'vitest';
import { NOOP_LOGGER, parseLogConfig } from '../logger.ts';

describe('NOOP_LOGGER', () => {
  it('all methods are callable without throwing', () => {
    expect(() => NOOP_LOGGER.fatal('x')).not.toThrow();
    expect(() => NOOP_LOGGER.error('x')).not.toThrow();
    expect(() => NOOP_LOGGER.warn('x')).not.toThrow();
    expect(() => NOOP_LOGGER.info('x')).not.toThrow();
    expect(() => NOOP_LOGGER.debug('x')).not.toThrow();
    expect(() => NOOP_LOGGER.trace('x')).not.toThrow();
  });
});

describe('parseLogConfig', () => {
  it('defaults to info level and pretty=false', () => {
    expect(parseLogConfig({})).toEqual({ level: 'info', pretty: false });
  });

  it('parses valid LOG_LEVEL', () => {
    expect(parseLogConfig({ LOG_LEVEL: 'debug' })).toMatchObject({ level: 'debug' });
  });

  it('falls back to info for invalid LOG_LEVEL', () => {
    expect(parseLogConfig({ LOG_LEVEL: 'invalid' })).toMatchObject({ level: 'info' });
  });

  it('parses LOG_PRETTY=true', () => {
    expect(parseLogConfig({ LOG_PRETTY: 'true' })).toMatchObject({ pretty: true });
  });

  it('parses LOG_PRETTY=1', () => {
    expect(parseLogConfig({ LOG_PRETTY: '1' })).toMatchObject({ pretty: true });
  });
});
