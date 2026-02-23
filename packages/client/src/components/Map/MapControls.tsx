import { useMapStore } from '../../stores/mapStore';

export function MapControls() {
  const movePlayer = useMapStore((s) => s.movePlayer);

  return (
    <div className="map-controls" data-testid="map-controls">
      <span>WASD / Arrows — Move</span>
      <span>Enter / E — Enter building</span>
      <div className="map-dpad">
        <button
          type="button"
          className="dpad-btn"
          data-testid="dpad-up"
          onClick={() => movePlayer(0, -1)}
        >
          ▲
        </button>
        <div className="dpad-row">
          <button
            type="button"
            className="dpad-btn"
            data-testid="dpad-left"
            onClick={() => movePlayer(-1, 0)}
          >
            ◀
          </button>
          <button
            type="button"
            className="dpad-btn"
            data-testid="dpad-right"
            onClick={() => movePlayer(1, 0)}
          >
            ▶
          </button>
        </div>
        <button
          type="button"
          className="dpad-btn"
          data-testid="dpad-down"
          onClick={() => movePlayer(0, 1)}
        >
          ▼
        </button>
      </div>
    </div>
  );
}
