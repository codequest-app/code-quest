import type { Feature } from '../../lib/feature';
import type { Density } from '../../stores/usePreferencesStore';

interface DensityFeatureDeps {
  density: Density;
  setDensity: (v: Density) => void;
}

export function createDensityFeature({ density, setDensity }: DensityFeatureDeps): Feature {
  return {
    id: 'toggle-density',
    label: 'Toggle density',
    category: 'Settings',
    order: 11,
    state: { kind: 'toggle', active: density === 'compact' },
    execute() {
      setDensity(density === 'comfortable' ? 'compact' : 'comfortable');
    },
  };
}
