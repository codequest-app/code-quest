import type { EffortLevel } from '@code-quest/shared';
import { EffortSwitch } from '../../components/icons/EffortSwitch';
import type { MenuItemFeature } from '../../lib/feature';

export interface EffortFeatureDeps {
  effort: EffortLevel | null;
  effortLevels: EffortLevel[];
  onSetEffort: (effort: string) => void;
}

export function createEffortFeature({
  effort,
  effortLevels,
  onSetEffort,
}: EffortFeatureDeps): MenuItemFeature {
  return {
    id: 'effort-level',
    menuItem: {
      label: 'Effort',
      description: effort ? `(${effort.charAt(0).toUpperCase()}${effort.slice(1)})` : undefined,
      section: 'Model',
      order: 10,
      trailing: (
        <EffortSwitch level={effort ?? undefined} levels={effortLevels} onSelect={onSetEffort} />
      ),
    },
    execute() {
      if (effortLevels.length === 0) return;
      const idx = effort ? effortLevels.indexOf(effort) : -1;
      onSetEffort(effortLevels[(idx + 1) % effortLevels.length]);
    },
  };
}
