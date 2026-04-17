import type { PluginReloadResult } from '@code-quest/shared';
import { toast } from 'sonner';
import type { SlashCommandFeature } from '../../lib/feature';

export function createReloadPluginsFeature(
  reloadPlugins: () => Promise<PluginReloadResult>,
): SlashCommandFeature {
  function run() {
    reloadPlugins()
      .then((result) => {
        if (result.success) {
          toast.success('Plugins reloaded');
        } else {
          toast.error(`Failed to reload plugins: ${result.error ?? 'unknown'}`);
        }
      })
      .catch((e: unknown) => {
        toast.error(`Failed to reload plugins: ${e instanceof Error ? e.message : String(e)}`);
      });
  }

  return {
    id: 'reload-plugins',
    command: '/reload-plugins',
    invoke() {
      run();
    },
    execute() {
      run();
    },
  };
}
