import type { Feature } from '../../lib/feature';

export interface FastModeFeatureDeps {
  fastModeState: 'on' | 'off' | null;
  setFastMode: (enabled: boolean) => void;
}

export function createFastModeFeature({
  fastModeState,
  setFastMode,
}: FastModeFeatureDeps): Feature {
  const active = fastModeState === 'on';
  return {
    id: 'fast-mode',
    label: 'Toggle fast mode',
    category: 'Model',
    order: 30,
    state: { kind: 'toggle', active },
    execute() {
      setFastMode(!active);
    },
  };
}
