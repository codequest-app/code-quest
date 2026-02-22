import type { Zone } from '@code-quest/shared';
import { useThemeStore } from '../../stores/themeStore';

interface MapStatusBarProps {
  zone: Zone;
}

const ZONE_LABELS: Record<Zone, string> = {
  town: 'Town',
  wilderness: 'Wilderness',
  dungeon: 'Dungeon',
};

export function MapStatusBar({ zone }: MapStatusBarProps) {
  const { currentTheme, themes, setTheme } = useThemeStore();
  const themeNames = Array.from(themes.keys());

  return (
    <div className="map-status-bar" data-testid="map-status-bar">
      <span className="map-status-bar__zone">{ZONE_LABELS[zone]}</span>
      <select
        className="map-status-bar__theme-select"
        data-testid="theme-select"
        value={currentTheme}
        onChange={(e) => setTheme(e.target.value)}
      >
        {themeNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
