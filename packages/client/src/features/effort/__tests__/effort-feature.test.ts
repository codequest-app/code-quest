import { describe, expect, it, vi } from 'vitest';
import { createEffortFeature } from '../effort-feature.ts';

describe('createEffortFeature', () => {
  it('returns a Feature with id effort-level and section Model', () => {
    const feature = createEffortFeature({
      effort: null,
      effortLevels: ['low', 'medium', 'high', 'max'],
      onSetEffort: vi.fn(),
    });
    expect(feature.id).toBe('effort-level');
    expect(feature.section).toBe('Model');
  });

  it('label is Effort and description omitted when no level set', () => {
    const feature = createEffortFeature({
      effort: null,
      effortLevels: ['low', 'medium', 'high', 'max'],
      onSetEffort: vi.fn(),
    });
    expect(feature.label).toBe('Effort');
    expect(feature.description).toBeUndefined();
  });

  it('label is Effort and description shows current level', () => {
    const feature = createEffortFeature({
      effort: 'low',
      effortLevels: ['low', 'medium', 'high', 'max'],
      onSetEffort: vi.fn(),
    });
    expect(feature.label).toBe('Effort');
    expect(feature.description).toBe('(Low)');
  });

  it('state is segmented with options, currentValue and onSelect', () => {
    const onSetEffort = vi.fn();
    const feature = createEffortFeature({
      effort: 'medium',
      effortLevels: ['low', 'medium', 'high', 'max'],
      onSetEffort,
    });
    expect(feature.state).toMatchObject({
      kind: 'segmented',
      options: ['low', 'medium', 'high', 'max'],
      currentValue: 'medium',
    });
    if (feature.state?.kind !== 'segmented') throw new Error('expected segmented');
    feature.state.onSelect('high');
    expect(onSetEffort).toHaveBeenCalledWith('high');
  });

  it('state currentValue is null when no effort set', () => {
    const feature = createEffortFeature({
      effort: null,
      effortLevels: ['low', 'medium', 'high', 'max'],
      onSetEffort: vi.fn(),
    });
    expect(feature.state).toMatchObject({ kind: 'segmented', currentValue: null });
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
