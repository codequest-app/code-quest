import type { MenuItemFeature } from '../../lib/feature';
import type { ColorTheme } from '../../stores/usePreferencesStore';

interface ColorThemeFeatureDeps {
  colorTheme: ColorTheme;
  setColorTheme: (v: ColorTheme) => void;
}

export function createColorThemeFeature({
  colorTheme,
  setColorTheme,
}: ColorThemeFeatureDeps): MenuItemFeature {
  return {
    id: 'switch-color-theme',
    menuItem: {
      label: 'Switch theme',
      section: 'Settings',
      order: 10,
      closeSilent: true,
      trailing: (
        <span className="text-[11px] text-text-muted uppercase tracking-wide">{colorTheme}</span>
      ),
    },
    execute() {
      setColorTheme(colorTheme === 'dark' ? 'light' : 'dark');
    },
  };
}
