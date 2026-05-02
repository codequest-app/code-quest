import { describe, expect, it } from 'vitest';
import type { Feature, FeatureState } from '../feature.ts';

describe('Feature type', () => {
  it('accepts a plain action feature', () => {
    const f: Feature = {
      id: 'clear',
      label: 'Clear',
      section: 'Context',
      execute() {},
    };
    expect(f.id).toBe('clear');
  });

  it('accepts a feature with toggle state', () => {
    const f: Feature = {
      id: 'fast-mode',
      label: 'Toggle',
      section: 'Model',
      state: { kind: 'toggle', active: true },
      execute() {},
    };
    expect(f.state?.kind).toBe('toggle');
  });

  it('accepts a feature with slash binding', () => {
    const f: Feature = {
      id: 'btw',
      label: '/btw',
      section: 'Slash Commands',
      execute() {},
      slash: { command: '/btw', invoke() {} },
    };
    expect(f.slash?.command).toBe('/btw');
  });

  it('FeatureState is a discriminated union', () => {
    const toggle: FeatureState = { kind: 'toggle', active: false };
    const tri: FeatureState = {
      kind: 'group',
      items: [{ value: 'x', label: 'x', on: true, toggle: () => {} }],
    };
    const sel: FeatureState = { kind: 'select', currentValue: 'x' };
    expect([toggle.kind, tri.kind, sel.kind]).toEqual(['toggle', 'group', 'select']);
  });
});
