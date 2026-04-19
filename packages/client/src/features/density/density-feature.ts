import { createChoiceFeature } from '../../lib/create-choice-feature';
import type { Feature } from '../../lib/feature';
import type { Density } from '../../stores/usePreferencesStore';

interface DensityFeatureDeps {
  density: Density;
  setDensity: (v: Density) => void;
}

export function createDensityFeature({ density, setDensity }: DensityFeatureDeps): Feature {
  return createChoiceFeature<Density>({
    id: 'density',
    label: 'Density',
    section: 'Settings',
    order: 11,
    tabs: ['actions'],
    options: [
      { value: 'comfortable', label: 'Comfortable' },
      { value: 'compact', label: 'Compact' },
    ],
    currentValue: density,
    onSelect: setDensity,
  });
}
