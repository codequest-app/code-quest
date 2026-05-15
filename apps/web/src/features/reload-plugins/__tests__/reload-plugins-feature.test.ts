import type { PluginReloadResult } from '@code-quest/schemas';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReloadPluginsFeature } from '../reload-plugins-feature.ts';

describe('createReloadPluginsFeature', () => {
  let reloadPlugins: () => Promise<PluginReloadResult>;

  beforeEach(() => {
    reloadPlugins = vi.fn<() => Promise<PluginReloadResult>>().mockResolvedValue({ success: true });
  });

  it('slash invoke calls reloadPlugins', () => {
    createReloadPluginsFeature(reloadPlugins).slash?.invoke('/reload-plugins');
    expect(reloadPlugins).toHaveBeenCalledOnce();
  });

  it('execute calls reloadPlugins', () => {
    createReloadPluginsFeature(reloadPlugins).execute();
    expect(reloadPlugins).toHaveBeenCalledOnce();
  });
});
