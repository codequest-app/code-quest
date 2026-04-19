import type { EffortLevel } from '@code-quest/shared';
import type { Feature } from '../../lib/feature';

interface EffortFeatureDeps {
  effort: EffortLevel | null;
  effortLevels: EffortLevel[];
  onSetEffort: (effort: string) => void;
}

export function createEffortFeature({
  effort,
  effortLevels,
  onSetEffort,
}: EffortFeatureDeps): Feature {
  return {
    id: 'effort-level',
    label: 'Effort',
    description: effort ? `(${effort.charAt(0).toUpperCase()}${effort.slice(1)})` : undefined,
    section: 'Model',
    order: 10,
    state: {
      kind: 'segmented',
      options: effortLevels,
      currentValue: effort,
      onSelect: onSetEffort,
    },
    ui: { closeSilent: true },
    execute() {
      if (effortLevels.length === 0) return;
      const idx = effort ? effortLevels.indexOf(effort) : -1;
      onSetEffort(effortLevels[(idx + 1) % effortLevels.length]);
    },
  };
}
