import type { LocationDef } from '@code-quest/shared';
import { useEffect, useState } from 'react';

interface LocationInteriorProps {
  location: LocationDef;
  onExit: () => void;
}

const SHOPS = [
  { id: 'skills', icon: '🔮', name: 'Skills Shop' },
  { id: 'forge', icon: '⚒️', name: 'Skill Forge' },
  { id: 'mcp-library', icon: '📚', name: 'MCP Tools Library' },
  { id: 'subagent', icon: '🧙', name: 'Subagent Guild' },
  { id: 'treasury', icon: '🏆', name: 'Treasury' },
  { id: 'training', icon: '🎯', name: 'Training Ground' },
  { id: 'bank', icon: '💰', name: 'Bank' },
];

function PlayerHomeContent() {
  const [rested, setRested] = useState(false);
  return (
    <div className="interior-content" data-testid="interior-home">
      {rested ? (
        <p>You are fully rested. HP and MP restored!</p>
      ) : (
        <button type="button" className="interior-action-btn" onClick={() => setRested(true)}>
          Rest (Restore HP/MP)
        </button>
      )}
      <button type="button" className="interior-action-btn">
        Settings
      </button>
    </div>
  );
}

function LocationContent({ id }: { id: string }) {
  switch (id) {
    case 'tavern':
      return (
        <div className="interior-content" data-testid="interior-tavern">
          <p>The AI bartender greets you warmly.</p>
          <p>Ask anything — the bartender is always ready to chat.</p>
        </div>
      );
    case 'shopping_district':
      return (
        <div className="interior-content" data-testid="interior-shopping">
          <div className="interior-shops">
            {SHOPS.map((shop) => (
              <button
                key={shop.id}
                type="button"
                className="interior-shop-btn"
                data-testid={`shop-${shop.id}`}
              >
                <span>{shop.icon}</span> {shop.name}
              </button>
            ))}
          </div>
        </div>
      );
    case 'stasis_chamber':
      return (
        <div className="interior-content" data-testid="interior-stasis">
          <p>Time freezes here. Enter Plan Mode to think deeply.</p>
          <button type="button" className="interior-action-btn">
            Enter Plan Mode
          </button>
        </div>
      );
    case 'guild_hall':
      return (
        <div className="interior-content" data-testid="interior-guild">
          <p>Worktree Management Center</p>
          <p>View and manage your parallel timelines.</p>
        </div>
      );
    case 'player_home':
      return <PlayerHomeContent />;
    case 'training_ground':
      return (
        <div className="interior-content" data-testid="interior-training">
          <p>Practice and test skills without consuming resources.</p>
        </div>
      );
    case 'library':
      return (
        <div className="interior-content" data-testid="interior-library">
          <p>Browse and install MCP tools and extensions.</p>
        </div>
      );
    default:
      return null;
  }
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
      <LocationContent id={location.id} />
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
