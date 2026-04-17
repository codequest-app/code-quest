import { afterEach, describe, expect, it, vi } from 'vitest';
import { createModelFeature, modelOpenSignal } from '../model-feature';

afterEach(() => {
  modelOpenSignal.setOpen(false);
});

describe('createModelFeature', () => {
  it('has id model', () => {
    const feature = createModelFeature();
    expect(feature.id).toBe('model');
  });

  it('menuItem is in Model section with label Switch model', () => {
    const feature = createModelFeature();
    expect(feature.menuItem.label).toBe('Switch model');
    expect(feature.menuItem.section).toBe('Model');
  });

  it('execute sets signal open to true', () => {
    const feature = createModelFeature();
    expect(modelOpenSignal.isOpen).toBe(false);
    feature.execute();
    expect(modelOpenSignal.isOpen).toBe(true);
  });

  it('signal notifies subscriber on open', () => {
    const cb = vi.fn();
    const unsub = modelOpenSignal.subscribe(cb);
    createModelFeature().execute();
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });

  it('setOpen(false) closes signal', () => {
    modelOpenSignal.setOpen(true);
    modelOpenSignal.setOpen(false);
    expect(modelOpenSignal.isOpen).toBe(false);
  });

  it('setOpen with same value does not notify', () => {
    const cb = vi.fn();
    const unsub = modelOpenSignal.subscribe(cb);
    modelOpenSignal.setOpen(false); // already false
    expect(cb).not.toHaveBeenCalled();
    unsub();
  });
});
