import type { MapPosition } from '@code-quest/shared';

interface PlayerCharacterProps {
  position: MapPosition;
}

export function PlayerCharacter({ position }: PlayerCharacterProps) {
  return (
    <div
      className="map-player"
      data-testid="player-character"
      style={{
        gridColumn: String(position.x + 1),
        gridRow: String(position.y + 1),
      }}
    >
      🧙
    </div>
  );
}
