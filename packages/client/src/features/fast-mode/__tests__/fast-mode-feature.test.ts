import { describe, expect, it, vi } from 'vitest';
import { createFastModeFeature } from '../fast-mode-feature.ts';

describe('createFastModeFeature', () => {
  it('returns a Feature with id fast-mode in Model section', () => {
    const feature = createFastModeFeature({ fastModeState: null, setFastMode: vi.fn() });
    expect(feature.id).toBe('fast-mode');
    expect(feature.section).toBe('Model');
    expect(feature.label).toBe('Toggle fast mode');
    expect(feature.order).toBe(30);
  });

  it('state reflects fastModeState: on → active true', () => {
    const feature = createFastModeFeature({ fastModeState: 'on', setFastMode: vi.fn() });
    expect(feature.state).toEqual({ kind: 'toggle', active: true });
  });

  it('state reflects fastModeState: off → active false', () => {
    const feature = createFastModeFeature({ fastModeState: 'off', setFastMode: vi.fn() });
    expect(feature.state).toEqual({ kind: 'toggle', active: false });
  });

  it('state reflects fastModeState: null → active false', () => {
    const feature = createFastModeFeature({ fastModeState: null, setFastMode: vi.fn() });
    expect(feature.state).toEqual({ kind: 'toggle', active: false });
  });

  it('execute calls setFastMode(true) when fastModeState is off', () => {
    const setFastMode = vi.fn();
    createFastModeFeature({ fastModeState: 'off', setFastMode }).execute();
    expect(setFastMode).toHaveBeenCalledWith(true);
  });

  it('execute calls setFastMode(true) when fastModeState is null', () => {
    const setFastMode = vi.fn();
    createFastModeFeature({ fastModeState: null, setFastMode }).execute();
    expect(setFastMode).toHaveBeenCalledWith(true);
  });

  it('execute calls setFastMode(false) when fastModeState is on', () => {
    const setFastMode = vi.fn();
    createFastModeFeature({ fastModeState: 'on', setFastMode }).execute();
    expect(setFastMode).toHaveBeenCalledWith(false);
  });
});
