import { describe, expect, it, vi } from 'vitest';
import { createFontSizeFeature } from '../font-size-feature';

describe('createFontSizeFeature', () => {
  it('has correct id/section/label', () => {
    const feature = createFontSizeFeature({ fontSize: 'md', setFontSize: vi.fn() });
    expect(feature.id).toBe('font-size');
    expect(feature.section).toBe('Settings');
    expect(feature.label).toBe('Font size');
  });

  it('state is choice with Small/Medium/Large options', () => {
    const setFontSize = vi.fn();
    const feature = createFontSizeFeature({ fontSize: 'md', setFontSize });
    expect(feature.state).toMatchObject({
      kind: 'choice',
      options: [
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
      ],
      currentValue: 'md',
    });
    if (feature.state?.kind !== 'choice') throw new Error('expected choice');
    feature.state.onSelect('lg');
    expect(setFontSize).toHaveBeenCalledWith('lg');
  });

  it('execute cycles sm -> md -> lg -> sm', () => {
    const setFontSize = vi.fn();
    createFontSizeFeature({ fontSize: 'sm', setFontSize }).execute();
    expect(setFontSize).toHaveBeenLastCalledWith('md');

    setFontSize.mockClear();
    createFontSizeFeature({ fontSize: 'md', setFontSize }).execute();
    expect(setFontSize).toHaveBeenLastCalledWith('lg');

    setFontSize.mockClear();
    createFontSizeFeature({ fontSize: 'lg', setFontSize }).execute();
    expect(setFontSize).toHaveBeenLastCalledWith('sm');
  });

  it('ui.closeSilent is true (picking a pill keeps Cmd+K open)', () => {
    const feature = createFontSizeFeature({ fontSize: 'md', setFontSize: vi.fn() });
    expect(feature.ui?.closeSilent).toBe(true);
  });
});
