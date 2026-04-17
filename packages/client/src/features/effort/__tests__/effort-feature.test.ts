import { describe, expect, it, vi } from 'vitest';
import { createEffortFeature } from '../effort-feature';

describe('createEffortFeature', () => {
  it('returns a MenuItemFeature with id effort-level and section Model', () => {
    const feature = createEffortFeature({
      effort: null,
      effortLevels: ['low', 'medium', 'high', 'max'],
      onSetEffort: vi.fn(),
    });
    expect(feature.id).toBe('effort-level');
    expect(feature.menuItem.section).toBe('Model');
  });

  it('label shows just Effort and no description when no level set', () => {
    const feature = createEffortFeature({
      effort: null,
      effortLevels: ['low', 'medium', 'high', 'max'],
      onSetEffort: vi.fn(),
    });
    expect(feature.menuItem.label).toBe('Effort');
    expect(feature.menuItem.description).toBeUndefined();
  });

  it('label is always Effort and description shows current level', () => {
    const feature = createEffortFeature({
      effort: 'low',
      effortLevels: ['low', 'medium', 'high', 'max'],
      onSetEffort: vi.fn(),
    });
    expect(feature.menuItem.label).toBe('Effort');
    expect(feature.menuItem.description).toBe('(Low)');
  });

  it('execute cycles to next effort level', () => {
    const onSetEffort = vi.fn();
    const feature = createEffortFeature({
      effort: 'low',
      effortLevels: ['low', 'medium', 'high', 'max'],
      onSetEffort,
    });
    feature.execute();
    expect(onSetEffort).toHaveBeenCalledWith('medium');
  });

  it('execute wraps around from last to first level', () => {
    const onSetEffort = vi.fn();
    const feature = createEffortFeature({
      effort: 'max',
      effortLevels: ['low', 'medium', 'high', 'max'],
      onSetEffort,
    });
    feature.execute();
    expect(onSetEffort).toHaveBeenCalledWith('low');
  });

  it('execute does nothing when effortLevels is empty', () => {
    const onSetEffort = vi.fn();
    const feature = createEffortFeature({
      effort: null,
      effortLevels: [],
      onSetEffort,
    });
    feature.execute();
    expect(onSetEffort).not.toHaveBeenCalled();
  });
});
