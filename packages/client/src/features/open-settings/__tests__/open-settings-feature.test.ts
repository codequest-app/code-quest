import { describe, expect, it, vi } from 'vitest';
import { createOpenSettingsFeature } from '../open-settings-feature';

describe('createOpenSettingsFeature', () => {
  it('has correct id/category/label/order and closeSilent false', () => {
    const feature = createOpenSettingsFeature({ onOpen: vi.fn() });
    expect(feature.id).toBe('open-settings');
    expect(feature.category).toBe('Settings');
    expect(feature.label).toBe('Open preferences');
    expect(feature.order).toBe(20);
    expect(feature.ui?.closeSilent).toBe(false);
  });

  it('execute calls onOpen', () => {
    const onOpen = vi.fn();
    createOpenSettingsFeature({ onOpen }).execute();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
