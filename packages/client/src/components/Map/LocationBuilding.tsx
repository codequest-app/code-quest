import type { LocationDef } from '@code-quest/shared';
import { useBattleStore } from '../../stores/battleStore';
import { useMapStore } from '../../stores/mapStore';

interface LocationBuildingProps {
  location: LocationDef;
  onEnter: (id: string) => void;
}

export function LocationBuilding({ location, onEnter }: LocationBuildingProps) {
  const playerLevel = useBattleStore((s) => s.player.level);
  const completedDungeons = useMapStore((s) => s.completedDungeons);
  const locked = location.requiresLevel > playerLevel;
  const completed = completedDungeons.has(location.id);

  return (
    <button
      type="button"
      className={`map-building${locked ? ' map-building--locked' : ''}${completed ? ' map-building--completed' : ''}`}
      data-testid={`building-${location.id}`}
      style={{
        gridColumn: String(location.position.x + 1),
        gridRow: String(location.position.y + 1),
      }}
      onClick={() => onEnter(location.id)}
    >
      <span className="map-building__icon">
        {locked ? '🔒' : location.icon}
        {completed && ' ✅'}
      </span>
      <span className="map-building__name">{location.name}</span>
    </button>
  );
}
