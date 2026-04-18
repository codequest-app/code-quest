import type { MenuItemFeature } from '../../lib/feature';
import type { Density } from '../../stores/usePreferencesStore';

interface DensityFeatureDeps {
  density: Density;
  setDensity: (v: Density) => void;
}

export function createDensityFeature({ density, setDensity }: DensityFeatureDeps): MenuItemFeature {
  return {
    id: 'toggle-density',
    menuItem: {
      label: 'Toggle density',
      section: 'Settings',
      order: 11,
      closeSilent: true,
      trailing: (
        <span className="text-[11px] text-text-muted uppercase tracking-wide">{density}</span>
      ),
    },
    execute() {
      setDensity(density === 'comfortable' ? 'compact' : 'comfortable');
    },
  };
}
