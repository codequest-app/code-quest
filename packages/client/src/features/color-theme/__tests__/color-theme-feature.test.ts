import { describe, expect, it, vi } from 'vitest';
import { createColorThemeFeature } from '../color-theme-feature';

describe('createColorThemeFeature', () => {
  it('has correct id/section/label/order', () => {
    const feature = createColorThemeFeature({ colorTheme: 'dark', setColorTheme: vi.fn() });
    expect(feature.id).toBe('switch-color-theme');
    expect(feature.section).toBe('Settings');
    expect(feature.label).toBe('Theme');
    expect(feature.order).toBe(10);
  });

  it('state is choice with Dark/Light/System options', () => {
    const setColorTheme = vi.fn();
    const feature = createColorThemeFeature({ colorTheme: 'dark', setColorTheme });
    expect(feature.state).toMatchObject({
      kind: 'choice',
      options: [
        { value: 'dark', label: 'Dark' },
        { value: 'light', label: 'Light' },
        { value: 'system', label: 'System' },
      ],
      currentValue: 'dark',
    });
    if (feature.state?.kind !== 'choice') throw new Error('expected choice');
    feature.state.onSelect('system');
    expect(setColorTheme).toHaveBeenCalledWith('system');
  });

  it('currentValue reflects system preference', () => {
    const feature = createColorThemeFeature({ colorTheme: 'system', setColorTheme: vi.fn() });
    expect(feature.state).toMatchObject({ kind: 'choice', currentValue: 'system' });
  });

  it('execute cycles dark -> light', () => {
    const setColorTheme = vi.fn();
    createColorThemeFeature({ colorTheme: 'dark', setColorTheme }).execute();
    expect(setColorTheme).toHaveBeenCalledWith('light');
  });

  it('execute cycles light -> system', () => {
    const setColorTheme = vi.fn();
    createColorThemeFeature({ colorTheme: 'light', setColorTheme }).execute();
    expect(setColorTheme).toHaveBeenCalledWith('system');
  });

  it('execute wraps system -> dark', () => {
    const setColorTheme = vi.fn();
    createColorThemeFeature({ colorTheme: 'system', setColorTheme }).execute();
    expect(setColorTheme).toHaveBeenCalledWith('dark');
  });
});
