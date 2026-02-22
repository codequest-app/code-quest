import type { LocationDef } from '@code-quest/shared';
import { useEffect } from 'react';

interface LocationInteriorProps {
  location: LocationDef;
  onExit: () => void;
}

export function LocationInterior({ location, onExit }: LocationInteriorProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onExit();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  return (
    <div className="location-interior" data-testid="location-interior">
      <div className="location-interior__header">
        <span className="location-interior__icon">{location.icon}</span>
        <h2 className="location-interior__name">{location.name}</h2>
      </div>
      <p className="location-interior__description">{location.description}</p>
      <button
        type="button"
        className="location-interior__exit"
        data-testid="location-exit-btn"
        onClick={onExit}
      >
        ← Exit
      </button>
    </div>
  );
}
