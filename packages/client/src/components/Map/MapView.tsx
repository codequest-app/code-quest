import type { LocationDef, Zone } from '@code-quest/shared';
import { TOWN_LOCATIONS, WILDERNESS_LOCATIONS } from '@code-quest/shared';
import { useEffect, useMemo } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { useThemeStore } from '../../stores/themeStore';
import { LocationBuilding } from './LocationBuilding';
import { LocationInterior } from './LocationInterior';
import { MapControls } from './MapControls';
import { MapStatusBar } from './MapStatusBar';
import { PlayerCharacter } from './PlayerCharacter';
import './map.css';

const KEY_MAP: Record<string, [number, number]> = {
  w: [0, -1],
  a: [-1, 0],
  s: [0, 1],
  d: [1, 0],
  ArrowUp: [0, -1],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowRight: [1, 0],
};

const ZONE_LOCATIONS: Record<Zone, LocationDef[]> = {
  town: TOWN_LOCATIONS,
  wilderness: WILDERNESS_LOCATIONS,
  dungeon: [],
};

export function MapView() {
  const {
    currentZone,
    currentLocationId,
    playerPosition,
    movePlayer,
    enterLocation,
    exitLocation,
    changeZone,
  } = useMapStore();
  const theme = useThemeStore((s) => s.getTheme());
  const locations = useMemo(() => ZONE_LOCATIONS[currentZone], [currentZone]);

  useEffect(() => {
    if (currentLocationId) return;

    function handleKeyDown(e: KeyboardEvent) {
      const dir = KEY_MAP[e.key];
      if (dir) {
        e.preventDefault();
        movePlayer(dir[0], dir[1]);
        return;
      }

      if (e.key === 'e' || e.key === 'Enter') {
        const nearby = locations.find(
          (loc) => loc.position.x === playerPosition.x && loc.position.y === playerPosition.y,
        );
        if (nearby) {
          enterLocation(nearby.id);
        }
        return;
      }

      const shortcut = locations.find(
        (loc) => loc.shortcutKey?.toLowerCase() === e.key.toLowerCase(),
      );
      if (shortcut) {
        enterLocation(shortcut.id);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLocationId, movePlayer, enterLocation, playerPosition, locations]);

  const activeLocation = currentLocationId
    ? locations.find((loc) => loc.id === currentLocationId)
    : undefined;

  return (
    <div className={`map-view map-view--${theme.cssClass}`} data-testid="map-view">
      <MapStatusBar zone={currentZone} onChangeZone={changeZone} />
      {activeLocation ? (
        <LocationInterior location={activeLocation} onExit={exitLocation} />
      ) : (
        <>
          <div className="map-view__grid">
            {locations.map((loc) => (
              <LocationBuilding key={loc.id} location={loc} onEnter={enterLocation} />
            ))}
            <PlayerCharacter position={playerPosition} />
          </div>
          <MapControls />
        </>
      )}
    </div>
  );
}
