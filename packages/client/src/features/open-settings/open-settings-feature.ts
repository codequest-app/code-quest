import type { MenuItemFeature } from '../../lib/feature';

interface OpenSettingsFeatureDeps {
  onOpen: () => void;
}

export function createOpenSettingsFeature({ onOpen }: OpenSettingsFeatureDeps): MenuItemFeature {
  return {
    id: 'open-settings',
    menuItem: {
      label: 'Open preferences',
      section: 'Settings',
      order: 20,
      closeSilent: false,
    },
    execute: onOpen,
  };
}
