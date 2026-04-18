import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createColorThemeFeature } from '../color-theme-feature';

describe('createColorThemeFeature', () => {
  it('menuItem has closeSilent true and correct id/section/label/order', () => {
    const feature = createColorThemeFeature({ colorTheme: 'dark', setColorTheme: vi.fn() });
    expect(feature.id).toBe('switch-color-theme');
    expect(feature.menuItem.section).toBe('Settings');
    expect(feature.menuItem.label).toBe('Switch theme');
    expect(feature.menuItem.order).toBe(10);
    expect(feature.menuItem.closeSilent).toBe(true);
  });

  it('trailing reflects current colorTheme', () => {
    const feature = createColorThemeFeature({ colorTheme: 'light', setColorTheme: vi.fn() });
    const { container } = render(<>{feature.menuItem.trailing}</>);
    expect(container.textContent).toBe('light');
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
