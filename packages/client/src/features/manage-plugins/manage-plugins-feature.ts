import type { Feature } from '../../lib/feature';

export function createManagePluginsFeature({
  onManagePlugins,
}: {
  onManagePlugins?: () => void;
}): Feature {
  return {
    id: 'plugins',
    label: 'Manage plugins',
    category: 'Customize',
    order: 2,
    ui: { closeSilent: true },
    execute() {
      onManagePlugins?.();
    },
  };
}
