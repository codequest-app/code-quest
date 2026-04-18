import type { Feature } from '../../lib/feature';
import { createOpenSignal } from '../../lib/open-signal';

export const modelOpenSignal = createOpenSignal();

interface ModelFeatureDeps {
  modelLabel: string;
}

export function createModelFeature({ modelLabel }: ModelFeatureDeps): Feature {
  return {
    id: 'model',
    label: 'Switch model',
    category: 'Model',
    order: 0,
    state: { kind: 'select', currentValue: modelLabel },
    execute() {
      modelOpenSignal.setOpen(true);
    },
  };
}
