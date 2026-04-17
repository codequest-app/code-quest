import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import type { MenuItemFeature } from '../../lib/feature';

interface FastModeFeatureDeps {
  fastModeState: 'on' | 'off' | null;
  setFastMode: (enabled: boolean) => void;
}

export function createFastModeFeature({
  fastModeState,
  setFastMode,
}: FastModeFeatureDeps): MenuItemFeature {
  return {
    id: 'fast-mode',
    menuItem: {
      label: 'Toggle fast mode',
      section: 'Model',
      order: 30,
      trailing: <ToggleSwitch isOn={fastModeState === 'on'} />,
    },
    execute() {
      setFastMode(fastModeState === 'off' || !fastModeState);
    },
  };
}
