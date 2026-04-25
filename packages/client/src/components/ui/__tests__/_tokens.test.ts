import { describe, expect, it } from 'vitest';
import { controlBorder, focusRing } from '../_tokens';

describe('ui/_tokens', () => {
  it('focusRing is a non-empty string with focus-visible:ring-', () => {
    expect(focusRing).toMatch(/focus-visible:ring-/);
  });

  it('controlBorder applies a border', () => {
    expect(controlBorder).toMatch(/\bborder\b/);
  });
});
