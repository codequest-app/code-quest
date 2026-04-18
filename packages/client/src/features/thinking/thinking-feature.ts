import type { Feature } from '../../lib/feature';

interface ThinkingFeatureDeps {
  isThinkingOn: boolean;
  onSetThinkingLevel: (level: string) => void;
}

export function createThinkingFeature({
  isThinkingOn,
  onSetThinkingLevel,
}: ThinkingFeatureDeps): Feature {
  return {
    id: 'toggle-thinking',
    label: 'Thinking',
    category: 'Model',
    order: 20,
    state: { kind: 'toggle', active: isThinkingOn },
    execute() {
      onSetThinkingLevel(isThinkingOn ? 'off' : 'default_on');
    },
  };
}
