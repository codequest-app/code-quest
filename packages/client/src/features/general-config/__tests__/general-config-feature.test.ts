import { describe, expect, it } from 'vitest';
import { createGeneralConfigFeature } from '../general-config-feature';
import { generalConfigSignal } from '../general-config-signal';

describe('generalConfigSignal', () => {
  it('starts closed', () => {
    expect(generalConfigSignal.isOpen).toBe(false);
  });

  it('can be opened and closed', () => {
    generalConfigSignal.setOpen(true);
    expect(generalConfigSignal.isOpen).toBe(true);
    generalConfigSignal.setOpen(false);
    expect(generalConfigSignal.isOpen).toBe(false);
  });
});

describe('createGeneralConfigFeature', () => {
  it('has id general-config', () => {
    expect(createGeneralConfigFeature().id).toBe('general-config');
  });

  it('is in Settings category with closeSilent', () => {
    const feature = createGeneralConfigFeature();
    expect(feature.label).toBe('General config…');
    expect(feature.category).toBe('Settings');
    expect(feature.ui?.closeSilent).toBe(true);
  });

  it('execute opens generalConfigSignal', () => {
    generalConfigSignal.setOpen(false);
    createGeneralConfigFeature().execute();
    expect(generalConfigSignal.isOpen).toBe(true);
    generalConfigSignal.setOpen(false);
  });
});
