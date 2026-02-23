import type { LocationDef, Zone } from '@code-quest/shared';
import { DUNGEON_LOCATIONS, TOWN_LOCATIONS, WILDERNESS_LOCATIONS } from '@code-quest/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMapStore } from '../../stores/mapStore';
import { useThemeStore } from '../../stores/themeStore';
import { LocationBuilding } from './LocationBuilding';
import { LocationInterior } from './LocationInterior';
import { MapControls } from './MapControls';
import { MapStatusBar } from './MapStatusBar';
import { Minimap } from './Minimap';
import { NpcEncounter } from './NpcEncounter';
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
  dungeon: DUNGEON_LOCATIONS,
};

const ZONE_LABELS: Record<Zone, string> = {
  town: 'Town',
  wilderness: 'Wilderness',
  dungeon: 'Dungeon',
};

interface MapViewProps {
  onSendMessage?: (message: string) => Promise<string>;
  onFetchTools?: () => void;
}

export function MapView({ onSendMessage, onFetchTools }: MapViewProps = {}) {
  const {
    currentZone,
    currentLocationId,
    playerPosition,
    pendingEncounter,
    pendingNpc,
    movePlayer,
    enterLocation,
    exitLocation,
    changeZone,
    dismissEncounter,
    dismissNpc,
  } = useMapStore();
  const theme = useThemeStore((s) => s.getTheme());
  const subZone = useMapStore((s) => s.getCurrentSubZone());
  const locations = useMemo(() => ZONE_LOCATIONS[currentZone], [currentZone]);
  const [pendingZone, setPendingZone] = useState<Zone | null>(null);

  useEffect(() => {
    onFetchTools?.();
  }, [onFetchTools]);

  const handleChangeZone = useCallback(
    (zone: Zone) => {
      if (zone === currentZone) return;
      setPendingZone(zone);
    },
    [currentZone],
  );

  const confirmZoneChange = useCallback(() => {
    if (pendingZone) {
      changeZone(pendingZone);
      setPendingZone(null);
    }
  }, [pendingZone, changeZone]);

  const cancelZoneChange = useCallback(() => {
    setPendingZone(null);
  }, []);

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
    <div
      className={`map-view map-view--${theme.cssClass}${activeLocation ? ' map-view--interior' : ''}`}
      data-testid="map-view"
    >
      <MapStatusBar zone={currentZone} onChangeZone={handleChangeZone} />
      {pendingZone && (
        <div className="zone-confirm-dialog" data-testid="zone-confirm-dialog">
          <p>Travel to {ZONE_LABELS[pendingZone]}?</p>
          <div className="zone-confirm-actions">
            <button
              type="button"
              className="interior-action-btn"
              data-testid="zone-confirm-btn"
              onClick={confirmZoneChange}
            >
              Confirm
            </button>
            <button
              type="button"
              className="location-interior__exit"
              data-testid="zone-cancel-btn"
              onClick={cancelZoneChange}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {pendingNpc && <NpcEncounter npc={pendingNpc} onDismiss={dismissNpc} />}
      {pendingEncounter && (
        <div className="encounter-overlay" data-testid="encounter-overlay">
          <h3>Encounter!</h3>
          <p>A wild enemy appears!</p>
          <div className="zone-confirm-actions">
            <button
              type="button"
              className="interior-action-btn"
              data-testid="encounter-fight-btn"
              onClick={() => {
                dismissEncounter();
                useMapStore.getState().forceBattle('wilderness encounter');
              }}
            >
              Fight
            </button>
            <button
              type="button"
              className="location-interior__exit"
              data-testid="encounter-flee-btn"
              onClick={dismissEncounter}
            >
              Flee
            </button>
          </div>
        </div>
      )}
      {activeLocation ? (
        <LocationInterior
          location={activeLocation}
          onExit={exitLocation}
          onEngageBoss={(locationId) => {
            useMapStore.getState().triggerBattle(`dungeon boss: ${locationId}`);
          }}
          onPractice={() => {
            useMapStore.getState().forceBattle('training practice');
          }}
          onSendMessage={onSendMessage}
        />
      ) : (
        <>
          <div className={`map-view__grid${subZone ? ` map-view__grid--${subZone}` : ''}`}>
            {locations.map((loc) => (
              <LocationBuilding key={loc.id} location={loc} onEnter={enterLocation} />
            ))}
            <PlayerCharacter position={playerPosition} />
          </div>
          <Minimap />
          <MapControls />
        </>
      )}
    </div>
  );
}
