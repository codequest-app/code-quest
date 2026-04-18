import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReloadPluginsFeature } from '../reload-plugins-feature';

describe('createReloadPluginsFeature', () => {
  let reloadPlugins: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reloadPlugins = vi.fn().mockResolvedValue({ success: true });
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
