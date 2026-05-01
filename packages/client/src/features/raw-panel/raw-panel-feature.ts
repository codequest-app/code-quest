import type { Feature } from '@/lib/feature';

export interface RawPanelFeatureDeps {
  active: boolean;
  onToggle: () => void;
}

export function createRawPanelFeature({ active, onToggle }: RawPanelFeatureDeps): Feature {
  return {
    id: 'raw-panel',
    label: 'Raw Event Panel',
    section: 'Panels',
    state: { kind: 'toggle', active },
    execute() {
      onToggle();
    },
  };
}
