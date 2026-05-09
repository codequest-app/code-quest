import { describe, expect, it } from 'vitest';
import { getObfuscationOptions } from '../obfuscation-config.ts';

describe('getObfuscationOptions', () => {
  it('returns high by default', () => {
    const { level, options } = getObfuscationOptions();
    expect(level).toBe('high');
    expect(options).toHaveProperty('deadCodeInjection', true);
  });

  it('returns specified level', () => {
    expect(getObfuscationOptions('low').level).toBe('low');
    expect(getObfuscationOptions('medium').level).toBe('medium');
    expect(getObfuscationOptions('high').level).toBe('high');
    expect(getObfuscationOptions('none').level).toBe('none');
  });

  it('falls back to defaultLevel for invalid input', () => {
    expect(getObfuscationOptions('invalid').level).toBe('high');
    expect(getObfuscationOptions('invalid', 'low').level).toBe('low');
  });

  it('none returns empty options', () => {
    expect(getObfuscationOptions('none').options).toEqual({});
  });

  it('high includes all medium options plus deadCodeInjection', () => {
    const medium = getObfuscationOptions('medium').options as Record<string, unknown>;
    const high = getObfuscationOptions('high').options as Record<string, unknown>;

    for (const [key, value] of Object.entries(medium)) {
      expect(high[key]).toEqual(value);
    }
    expect(high).toHaveProperty('deadCodeInjection', true);
    expect(high).toHaveProperty('deadCodeInjectionThreshold', 0.4);
  });
});
