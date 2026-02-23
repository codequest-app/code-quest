import type { LocationDef, Zone } from '@code-quest/shared';
import { DUNGEON_LOCATIONS, TOWN_LOCATIONS, WILDERNESS_LOCATIONS } from '@code-quest/shared';
import { useMemo } from 'react';
import { GRID_HEIGHT, GRID_WIDTH, useMapStore } from '../../stores/mapStore';

const ZONE_LOCATIONS: Record<Zone, LocationDef[]> = {
  town: TOWN_LOCATIONS,
  wilderness: WILDERNESS_LOCATIONS,
  dungeon: DUNGEON_LOCATIONS,
};

export function Minimap() {
  const currentZone = useMapStore((s) => s.currentZone);
  const playerPosition = useMapStore((s) => s.playerPosition);
  const locations = useMemo(() => ZONE_LOCATIONS[currentZone], [currentZone]);

  const movePlayer = useMapStore((s) => s.movePlayer);

  function handleLocClick(loc: LocationDef) {
    const dx = loc.position.x - playerPosition.x;
    const dy = loc.position.y - playerPosition.y;
    movePlayer(dx, dy);
  }

  return (
    <div className="minimap" data-testid="minimap">
      {locations.map((loc) => (
        <button
          key={loc.id}
          type="button"
          className="minimap-dot minimap-dot--location"
          data-testid={`minimap-loc-${loc.id}`}
          style={{
            left: `${(loc.position.x / GRID_WIDTH) * 100}%`,
            top: `${(loc.position.y / GRID_HEIGHT) * 100}%`,
          }}
          title={loc.name}
          onClick={() => handleLocClick(loc)}
        />
      ))}
      <div
        className="minimap-dot minimap-player"
        data-testid="minimap-player"
        style={{
          left: `${(playerPosition.x / GRID_WIDTH) * 100}%`,
          top: `${(playerPosition.y / GRID_HEIGHT) * 100}%`,
        }}
      />
    </div>
  );
}
