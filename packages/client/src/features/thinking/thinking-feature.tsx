import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import type { MenuItemFeature } from '../../lib/feature';

interface ThinkingFeatureDeps {
  isThinkingOn: boolean;
  onSetThinkingLevel: (level: string) => void;
}

export function createThinkingFeature({
  isThinkingOn,
  onSetThinkingLevel,
}: ThinkingFeatureDeps): MenuItemFeature {
  return {
    id: 'toggle-thinking',
    menuItem: {
      label: 'Thinking',
      section: 'Model',
      order: 20,
      trailing: <ToggleSwitch isOn={isThinkingOn} />,
    },
    execute() {
      onSetThinkingLevel(isThinkingOn ? 'off' : 'default_on');
    },
  };
}
