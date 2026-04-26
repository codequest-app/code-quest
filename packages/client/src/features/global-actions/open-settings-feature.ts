import type { Feature } from '../../lib/feature';

interface OpenSettingsDeps {
  onOpen: () => void;
}

export function createOpenSettingsFeature({ onOpen }: OpenSettingsDeps): Feature {
  return {
    id: 'open-settings',
    label: 'Open Settings',
    section: 'Settings',
    tabs: ['all', 'actions'],
    order: 99,
    execute: onOpen,
  };
}
