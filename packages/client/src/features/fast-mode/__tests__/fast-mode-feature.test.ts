import { describe, expect, it, vi } from 'vitest';
import { createFastModeFeature } from '../fast-mode-feature';

describe('createFastModeFeature', () => {
  it('returns a MenuItemFeature with id fast-mode and section Model', () => {
    const feature = createFastModeFeature({
      fastModeState: null,
      setFastMode: vi.fn(),
    });
    expect(feature.id).toBe('fast-mode');
    expect(feature.menuItem.section).toBe('Model');
    expect(feature.menuItem.label).toBe('Toggle fast mode');
  });

  it('execute calls setFastMode(true) when fastModeState is off', () => {
    const setFastMode = vi.fn();
    const feature = createFastModeFeature({ fastModeState: 'off', setFastMode });
    feature.execute();
    expect(setFastMode).toHaveBeenCalledWith(true);
  });

  it('execute calls setFastMode(true) when fastModeState is null', () => {
    const setFastMode = vi.fn();
    const feature = createFastModeFeature({ fastModeState: null, setFastMode });
    feature.execute();
    expect(setFastMode).toHaveBeenCalledWith(true);
  });

  it('execute calls setFastMode(false) when fastModeState is on', () => {
    const setFastMode = vi.fn();
    const feature = createFastModeFeature({ fastModeState: 'on', setFastMode });
    feature.execute();
    expect(setFastMode).toHaveBeenCalledWith(false);
  });
});
