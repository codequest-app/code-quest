import type { LocationDef } from '@code-quest/shared';

interface LocationBuildingProps {
  location: LocationDef;
  onEnter: (id: string) => void;
}

export function LocationBuilding({ location, onEnter }: LocationBuildingProps) {
  return (
    <button
      type="button"
      className="map-building"
      data-testid={`building-${location.id}`}
      style={{
        gridColumn: String(location.position.x + 1),
        gridRow: String(location.position.y + 1),
      }}
      onClick={() => onEnter(location.id)}
    >
      <span className="map-building__icon">{location.icon}</span>
      <span className="map-building__name">{location.name}</span>
    </button>
  );
}
