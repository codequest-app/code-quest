import type { WildernessSubZoneId, Zone } from '@code-quest/shared';
import { WILDERNESS_SUB_ZONES } from '@code-quest/shared';
import { useMapStore } from '../../stores/mapStore';
import { useThemeStore } from '../../stores/themeStore';

interface MapStatusBarProps {
  zone: Zone;
  onChangeZone: (zone: Zone) => void;
}

const ZONES: { id: Zone; label: string }[] = [
  { id: 'town', label: 'Town' },
  { id: 'wilderness', label: 'Wilderness' },
  { id: 'dungeon', label: 'Dungeon' },
];

export function MapStatusBar({ zone, onChangeZone }: MapStatusBarProps) {
  const { currentTheme, themes, setTheme } = useThemeStore();
  const themeNames = Array.from(themes.keys());
  const subZoneId = useMapStore((s): WildernessSubZoneId | null => s.getCurrentSubZone());
  const subZone = subZoneId ? WILDERNESS_SUB_ZONES.find((z) => z.id === subZoneId) : null;

  return (
    <div className="map-status-bar" data-testid="map-status-bar">
      <div className="map-status-bar__zones">
        {ZONES.map((z) => (
          <button
            key={z.id}
            type="button"
            className={`map-status-bar__zone-btn${z.id === zone ? ' map-status-bar__zone-btn--active' : ''}`}
            data-testid={`zone-btn-${z.id}`}
            onClick={() => {
              if (z.id !== zone) onChangeZone(z.id);
            }}
          >
            {z.label}
          </button>
        ))}
      </div>
      {subZone && (
        <span className="map-status-bar__sub-zone" data-testid="sub-zone-label">
          {subZone.icon} {subZone.name}
        </span>
      )}
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
