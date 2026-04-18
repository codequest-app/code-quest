import type { Feature } from '../../lib/feature';

interface OpenSettingsFeatureDeps {
  onOpen: () => void;
}

export function createOpenSettingsFeature({ onOpen }: OpenSettingsFeatureDeps): Feature {
  return {
    id: 'open-settings',
    label: 'Open preferences',
    category: 'Settings',
    order: 20,
    ui: { closeSilent: false },
    execute: onOpen,
  };
}
