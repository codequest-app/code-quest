import { describe, expect, it, vi } from 'vitest';
import { createColorThemeFeature } from '../color-theme-feature';

describe('createColorThemeFeature', () => {
  it('has correct id/category/label/order', () => {
    const feature = createColorThemeFeature({ colorTheme: 'dark', setColorTheme: vi.fn() });
    expect(feature.id).toBe('switch-color-theme');
    expect(feature.category).toBe('Settings');
    expect(feature.label).toBe('Switch theme');
    expect(feature.order).toBe(10);
  });

  it('state reflects current colorTheme as toggle (dark → active true)', () => {
    const feature = createColorThemeFeature({ colorTheme: 'dark', setColorTheme: vi.fn() });
    expect(feature.state).toEqual({ kind: 'toggle', active: true });
  });

  it('state reflects current colorTheme as toggle (light → active false)', () => {
    const feature = createColorThemeFeature({ colorTheme: 'light', setColorTheme: vi.fn() });
    expect(feature.state).toEqual({ kind: 'toggle', active: false });
  });

  it('execute toggles dark -> light', () => {
    const setColorTheme = vi.fn();
    createColorThemeFeature({ colorTheme: 'dark', setColorTheme }).execute();
    expect(setColorTheme).toHaveBeenCalledWith('light');
  });

  it('execute toggles light -> dark', () => {
    const setColorTheme = vi.fn();
    createColorThemeFeature({ colorTheme: 'light', setColorTheme }).execute();
    expect(setColorTheme).toHaveBeenCalledWith('dark');
  });
});
