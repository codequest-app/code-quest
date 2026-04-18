import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDensityFeature } from '../density-feature';

describe('createDensityFeature', () => {
  it('menuItem has closeSilent true and correct id/section/label/order', () => {
    const feature = createDensityFeature({ density: 'comfortable', setDensity: vi.fn() });
    expect(feature.id).toBe('toggle-density');
    expect(feature.menuItem.section).toBe('Settings');
    expect(feature.menuItem.label).toBe('Toggle density');
    expect(feature.menuItem.order).toBe(11);
    expect(feature.menuItem.closeSilent).toBe(true);
  });

  it('trailing reflects current density', () => {
    const feature = createDensityFeature({ density: 'compact', setDensity: vi.fn() });
    const { container } = render(<>{feature.menuItem.trailing}</>);
    expect(container.textContent).toBe('compact');
  });

  it('execute toggles comfortable -> compact', () => {
    const setDensity = vi.fn();
    createDensityFeature({ density: 'comfortable', setDensity }).execute();
    expect(setDensity).toHaveBeenCalledWith('compact');
  });

  it('execute toggles compact -> comfortable', () => {
    const setDensity = vi.fn();
    createDensityFeature({ density: 'compact', setDensity }).execute();
    expect(setDensity).toHaveBeenCalledWith('comfortable');
  });
});
