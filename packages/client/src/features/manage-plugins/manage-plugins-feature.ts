import type { MenuItemFeature } from '../../lib/feature';

export function createManagePluginsFeature({
  onManagePlugins,
}: {
  onManagePlugins?: () => void;
}): MenuItemFeature {
  return {
    id: 'plugins',
    menuItem: { label: 'Manage plugins', section: 'Customize', order: 2, closeSilent: true },
    execute() {
      onManagePlugins?.();
    },
  };
}
