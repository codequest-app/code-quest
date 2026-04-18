import { describe, expect, it, vi } from 'vitest';
import { createDensityFeature } from '../density-feature';

describe('createDensityFeature', () => {
  it('has correct id/category/label/order', () => {
    const feature = createDensityFeature({ density: 'comfortable', setDensity: vi.fn() });
    expect(feature.id).toBe('toggle-density');
    expect(feature.category).toBe('Settings');
    expect(feature.label).toBe('Toggle density');
    expect(feature.order).toBe(11);
  });

  it('state reflects current density as toggle (compact → active true)', () => {
    const feature = createDensityFeature({ density: 'compact', setDensity: vi.fn() });
    expect(feature.state).toEqual({ kind: 'toggle', active: true });
  });

  it('state reflects current density as toggle (comfortable → active false)', () => {
    const feature = createDensityFeature({ density: 'comfortable', setDensity: vi.fn() });
    expect(feature.state).toEqual({ kind: 'toggle', active: false });
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
