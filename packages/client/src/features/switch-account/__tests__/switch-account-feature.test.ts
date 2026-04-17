import { describe, expect, it } from 'vitest';
import { createSwitchAccountFeature } from '../switch-account-feature';
import { switchAccountSignal } from '../switch-account-signal';

describe('switchAccountSignal', () => {
  it('starts closed', () => {
    expect(switchAccountSignal.isOpen).toBe(false);
  });

  it('can be opened and closed', () => {
    switchAccountSignal.setOpen(true);
    expect(switchAccountSignal.isOpen).toBe(true);
    switchAccountSignal.setOpen(false);
    expect(switchAccountSignal.isOpen).toBe(false);
  });
});

describe('createSwitchAccountFeature', () => {
  it('has id switch-account', () => {
    expect(createSwitchAccountFeature().id).toBe('switch-account');
  });

  it('menuItem is in Settings section with closeSilent', () => {
    const feature = createSwitchAccountFeature();
    expect(feature.menuItem.label).toBe('Switch account');
    expect(feature.menuItem.section).toBe('Settings');
    expect(feature.menuItem.closeSilent).toBe(true);
  });

  it('execute opens switchAccountSignal', () => {
    switchAccountSignal.setOpen(false);
    createSwitchAccountFeature().execute();
    expect(switchAccountSignal.isOpen).toBe(true);
    switchAccountSignal.setOpen(false);
  });
});
