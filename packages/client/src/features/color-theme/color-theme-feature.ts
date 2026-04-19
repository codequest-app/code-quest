import { createChoiceFeature } from '../../lib/create-choice-feature';
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
  return createChoiceFeature<ColorTheme>({
    id: 'switch-color-theme',
    label: 'Theme',
    section: 'Settings',
    order: 10,
    tabs: ['actions'],
    options: [
      { value: 'dark', label: 'Dark' },
      { value: 'light', label: 'Light' },
    ],
    currentValue: colorTheme,
    onSelect: setColorTheme,
  });
}
