import { describe, expect, it } from 'vitest';
import { controlBorder, focusRing, tabTrigger, tabTriggerCompact } from '../_tokens.ts';

describe('ui/_tokens', () => {
  it('focusRing is a non-empty string with focus-visible:ring-', () => {
    expect(focusRing).toMatch(/focus-visible:ring-/);
  });

  it('controlBorder applies a border', () => {
    expect(controlBorder).toMatch(/\bborder\b/);
  });

  it('tabTrigger includes active indicator and text color classes', () => {
    expect(tabTrigger).toMatch(/border-b-2/);
    expect(tabTrigger).toMatch(/data-\[state=active\]:border-accent/);
    expect(tabTrigger).toMatch(/data-\[state=active\]:text-text/);
  });

  it('tabTriggerCompact extends tabTrigger with compact sizing', () => {
    expect(tabTriggerCompact).toContain('border-b-2');
    expect(tabTriggerCompact).toContain('text-xs');
    expect(tabTriggerCompact).toContain('px-3');
  });
});
