import { afterEach, describe, expect, it, vi } from 'vitest';
import { createModelFeature, modelOpenSignal } from '../model-feature';

afterEach(() => {
  modelOpenSignal.setOpen(false);
});

describe('createModelFeature', () => {
  it('has id model', () => {
    const feature = createModelFeature({ modelLabel: 'Opus' });
    expect(feature.id).toBe('model');
  });

  it('is in Model section with label Switch model', () => {
    const feature = createModelFeature({ modelLabel: 'Opus' });
    expect(feature.label).toBe('Switch model');
    expect(feature.section).toBe('Model');
  });

  it('state is select with currentValue reflecting modelLabel', () => {
    const feature = createModelFeature({ modelLabel: 'Opus 4' });
    expect(feature.state).toEqual({ kind: 'select', currentValue: 'Opus 4' });
  });

  it('opens model dialog without closing the menu (closeSilent: true)', () => {
    const feature = createModelFeature({ modelLabel: 'Opus' });
    // Parity with main: clicking Switch model opens the picker dialog and
    // leaves the menu's close behavior to the dialog — main set closeSilent
    // explicitly on menuItem; Feature shape expresses it via ui.closeSilent.
    expect(feature.ui?.closeSilent).toBe(true);
  });

  it('execute sets signal open to true', () => {
    const feature = createModelFeature({ modelLabel: 'Opus' });
    expect(modelOpenSignal.isOpen).toBe(false);
    feature.execute();
    expect(modelOpenSignal.isOpen).toBe(true);
  });

  it('signal notifies subscriber on open', () => {
    const cb = vi.fn();
    const unsub = modelOpenSignal.subscribe(cb);
    createModelFeature({ modelLabel: 'Opus' }).execute();
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
