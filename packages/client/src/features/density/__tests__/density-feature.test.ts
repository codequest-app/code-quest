import { describe, expect, it, vi } from 'vitest';
import { createDensityFeature } from '../density-feature.ts';

describe('createDensityFeature', () => {
  it('has correct id/section/label/order', () => {
    const feature = createDensityFeature({ density: 'comfortable', setDensity: vi.fn() });
    expect(feature.id).toBe('density');
    expect(feature.section).toBe('Settings');
    expect(feature.label).toBe('Density');
    expect(feature.order).toBe(11);
  });

  it('state is choice with Comfortable/Compact options', () => {
    const setDensity = vi.fn();
    const feature = createDensityFeature({ density: 'compact', setDensity });
    expect(feature.state).toMatchObject({
      kind: 'choice',
      options: [
        { value: 'comfortable', label: 'Comfortable' },
        { value: 'compact', label: 'Compact' },
      ],
      currentValue: 'compact',
    });
    if (feature.state?.kind !== 'choice') throw new Error('expected choice');
    feature.state.onSelect('comfortable');
    expect(setDensity).toHaveBeenCalledWith('comfortable');
  });

  it('execute cycles comfortable -> compact (for Enter key)', () => {
    const setDensity = vi.fn();
    createDensityFeature({ density: 'comfortable', setDensity }).execute();
    expect(setDensity).toHaveBeenCalledWith('compact');
  });

  it('execute wraps compact -> comfortable', () => {
    const setDensity = vi.fn();
    createDensityFeature({ density: 'compact', setDensity }).execute();
    expect(setDensity).toHaveBeenCalledWith('comfortable');
  });
});
