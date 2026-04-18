import type { Feature } from '../../lib/feature';
import type { ColorTheme } from '../../stores/usePreferencesStore';

interface ColorThemeFeatureDeps {
  colorTheme: ColorTheme;
  setColorTheme: (v: ColorTheme) => void;
}

export function createColorThemeFeature({
  colorTheme,
  setColorTheme,
}: ColorThemeFeatureDeps): Feature {
  return {
    id: 'switch-color-theme',
    label: 'Switch theme',
    category: 'Settings',
    order: 10,
    state: { kind: 'toggle', active: colorTheme === 'dark' },
    execute() {
      setColorTheme(colorTheme === 'dark' ? 'light' : 'dark');
    },
  };
}
