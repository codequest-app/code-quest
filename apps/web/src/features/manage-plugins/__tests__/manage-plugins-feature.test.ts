import { describe, expect, it, vi } from 'vitest';
import { createManagePluginsFeature } from '../manage-plugins-feature.ts';

describe('createManagePluginsFeature', () => {
  it('has id plugins and label Manage plugins in Customize section', () => {
    const feature = createManagePluginsFeature({ onManagePlugins: vi.fn() });
    expect(feature.id).toBe('plugins');
    expect(feature.label).toBe('Manage plugins');
    expect(feature.section).toBe('Customize');
    expect(feature.order).toBe(2);
    expect(feature.ui?.closeSilent).toBe(true);
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
