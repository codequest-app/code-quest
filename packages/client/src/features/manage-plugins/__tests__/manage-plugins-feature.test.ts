import { describe, expect, it, vi } from 'vitest';
import { createManagePluginsFeature } from '../manage-plugins-feature';

describe('createManagePluginsFeature', () => {
  it('has id plugins and label Manage plugins in Customize section', () => {
    const feature = createManagePluginsFeature({ onManagePlugins: vi.fn() });
    expect(feature.id).toBe('plugins');
    expect(feature.menuItem.label).toBe('Manage plugins');
    expect(feature.menuItem.section).toBe('Customize');
    expect(feature.menuItem.order).toBe(2);
    expect(feature.menuItem.closeSilent).toBe(true);
  });

  it('execute calls onManagePlugins', () => {
    const onManagePlugins = vi.fn();
    createManagePluginsFeature({ onManagePlugins }).execute();
    expect(onManagePlugins).toHaveBeenCalledOnce();
  });

  it('execute is a no-op when onManagePlugins is undefined', () => {
    expect(() => createManagePluginsFeature({}).execute()).not.toThrow();
  });
});
