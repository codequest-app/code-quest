import { describe, expect, it, vi } from 'vitest';
import { createChoiceFeature } from '../create-choice-feature';

describe('createChoiceFeature', () => {
  it('returns a Feature with the declared identity fields', () => {
    const feature = createChoiceFeature({
      id: 'pref-foo',
      label: 'Foo',
      section: 'Settings',
      order: 42,
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
      currentValue: 'a',
      onSelect: vi.fn(),
    });
    expect(feature.id).toBe('pref-foo');
    expect(feature.label).toBe('Foo');
    expect(feature.section).toBe('Settings');
    expect(feature.order).toBe(42);
  });

  it('state is choice with options/currentValue/onSelect wired', () => {
    const onSelect = vi.fn();
    const feature = createChoiceFeature({
      id: 'x',
      label: 'X',
      section: 'Settings',
      order: 0,
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
      currentValue: 'a',
      onSelect,
    });
    expect(feature.state).toMatchObject({
      kind: 'choice',
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
      currentValue: 'a',
    });
    if (feature.state?.kind !== 'choice') throw new Error('expected choice');
    feature.state.onSelect('b');
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('ui.closeSilent defaults to true (picking a pill keeps Cmd+K open)', () => {
    const feature = createChoiceFeature({
      id: 'x',
      label: 'X',
      section: 'Settings',
      order: 0,
      options: [{ value: 'a', label: 'A' }],
      currentValue: 'a',
      onSelect: vi.fn(),
    });
    expect(feature.ui?.closeSilent).toBe(true);
  });

  it('execute cycles to the next option in two-value list', () => {
    const onSelect = vi.fn();
    createChoiceFeature({
      id: 'x',
      label: 'X',
      section: 'Settings',
      order: 0,
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
      currentValue: 'a',
      onSelect,
    }).execute();
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('execute wraps last → first', () => {
    const onSelect = vi.fn();
    createChoiceFeature({
      id: 'x',
      label: 'X',
      section: 'Settings',
      order: 0,
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
        { value: 'c', label: 'C' },
      ],
      currentValue: 'c',
      onSelect,
    }).execute();
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('execute from middle value cycles forward', () => {
    const onSelect = vi.fn();
    createChoiceFeature({
      id: 'x',
      label: 'X',
      section: 'Settings',
      order: 0,
      options: [
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
      ],
      currentValue: 'md',
      onSelect,
    }).execute();
    expect(onSelect).toHaveBeenCalledWith('lg');
  });
});
