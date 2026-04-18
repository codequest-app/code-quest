import { describe, expect, it } from 'vitest';
import type { Feature, FeatureState } from '../feature';
import { isFeature, isMenuItemFeature } from '../feature';

describe('Feature type', () => {
  it('accepts a plain action feature', () => {
    const f: Feature = {
      id: 'clear',
      label: 'Clear',
      category: 'Context',
      execute() {},
    };
    expect(f.id).toBe('clear');
  });

  it('accepts a feature with toggle state', () => {
    const f: Feature = {
      id: 'fast-mode',
      label: 'Toggle',
      category: 'Model',
      state: { kind: 'toggle', active: true },
      execute() {},
    };
    expect(f.state?.kind).toBe('toggle');
  });

  it('accepts a feature with slash binding', () => {
    const f: Feature = {
      id: 'btw',
      label: '/btw',
      category: 'Slash Commands',
      execute() {},
      slash: { command: '/btw', invoke() {} },
    };
    expect(f.slash?.command).toBe('/btw');
  });

  it('FeatureState is a discriminated union', () => {
    const toggle: FeatureState = { kind: 'toggle', active: false };
    const tri: FeatureState = { kind: 'tri-state', state: 'partial' };
    const sel: FeatureState = { kind: 'select', currentValue: 'x' };
    expect([toggle.kind, tri.kind, sel.kind]).toEqual(['toggle', 'tri-state', 'select']);
  });
});

describe('isFeature type guard', () => {
  it('returns true for Feature shape', () => {
    expect(isFeature({ id: 'a', label: 'A', category: 'X', execute() {} })).toBe(true);
  });

  it('returns false for MenuItemFeature shape (menuItem wrapper)', () => {
    expect(isFeature({ id: 'a', menuItem: { label: 'A', section: 'X' }, execute() {} })).toBe(
      false,
    );
  });

  it('returns false for null / non-object', () => {
    expect(isFeature(null)).toBe(false);
    expect(isFeature('x')).toBe(false);
    expect(isFeature({})).toBe(false);
  });
});

describe('isMenuItemFeature (legacy) remains intact', () => {
  it('still detects legacy shape', () => {
    expect(
      isMenuItemFeature({ id: 'a', menuItem: { label: 'A', section: 'X' }, execute() {} }),
    ).toBe(true);
  });
});
