import { describe, expect, it } from 'vitest';
import { isThinkingActive } from '../model-utils.ts';

describe('isThinkingActive', () => {
  it('false for nullish levels', () => {
    expect(isThinkingActive(undefined)).toBe(false);
    expect(isThinkingActive(null)).toBe(false);
    expect(isThinkingActive('')).toBe(false);
  });

  it('false for "off" (user disabled)', () => {
    expect(isThinkingActive('off')).toBe(false);
  });

  it('false for "disabled" (model does not support thinking)', () => {
    expect(isThinkingActive('disabled')).toBe(false);
  });

  it('true for any other level value', () => {
    expect(isThinkingActive('default_on')).toBe(true);
    expect(isThinkingActive('always_on')).toBe(true);
    expect(isThinkingActive('adaptive')).toBe(true);
  });
});
