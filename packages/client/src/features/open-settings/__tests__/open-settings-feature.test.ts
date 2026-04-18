import { describe, expect, it, vi } from 'vitest';
import { createOpenSettingsFeature } from '../open-settings-feature';

describe('createOpenSettingsFeature', () => {
  it('menuItem has correct id/section/label/order and closeSilent false', () => {
    const feature = createOpenSettingsFeature({ onOpen: vi.fn() });
    expect(feature.id).toBe('open-settings');
    expect(feature.menuItem.section).toBe('Settings');
    expect(feature.menuItem.label).toBe('Open preferences');
    expect(feature.menuItem.order).toBe(20);
    expect(feature.menuItem.closeSilent).toBe(false);
  });

  it('execute calls onOpen', () => {
    const onOpen = vi.fn();
    createOpenSettingsFeature({ onOpen }).execute();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
