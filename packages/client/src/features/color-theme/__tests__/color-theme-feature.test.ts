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

  it('state is choice with Dark/Light options and currentValue reflecting theme', () => {
    const setColorTheme = vi.fn();
    const feature = createColorThemeFeature({ colorTheme: 'dark', setColorTheme });
    expect(feature.state).toMatchObject({
      kind: 'choice',
      options: [
        { value: 'dark', label: 'Dark' },
        { value: 'light', label: 'Light' },
      ],
      currentValue: 'dark',
    });
    if (feature.state?.kind !== 'choice') throw new Error('expected choice');
    feature.state.onSelect('light');
    expect(setColorTheme).toHaveBeenCalledWith('light');
  });

  it('currentValue flips with colorTheme', () => {
    const feature = createColorThemeFeature({ colorTheme: 'light', setColorTheme: vi.fn() });
    expect(feature.state).toMatchObject({ kind: 'choice', currentValue: 'light' });
  });

  it('execute cycles to the other option (for Cmd+K Enter key)', () => {
    const setColorTheme = vi.fn();
    createColorThemeFeature({ colorTheme: 'dark', setColorTheme }).execute();
    expect(setColorTheme).toHaveBeenCalledWith('light');
  });

  it('execute wraps light -> dark', () => {
    const setColorTheme = vi.fn();
    createColorThemeFeature({ colorTheme: 'light', setColorTheme }).execute();
    expect(setColorTheme).toHaveBeenCalledWith('dark');
  });
});
