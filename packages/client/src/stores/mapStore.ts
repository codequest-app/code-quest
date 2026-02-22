import type { MapPosition, Zone } from '@code-quest/shared';
import { TOWN_LOCATIONS } from '@code-quest/shared';
import { create } from 'zustand';
import { useBattleStore } from './battleStore';

const MAP_STORAGE_KEY = 'code-quest-map';
const GRID_MAX_X = 9;
const GRID_MAX_Y = 7;

interface MapStore {
  currentZone: Zone;
  currentLocationId: string | null;
  playerPosition: MapPosition;
  movePlayer: (dx: number, dy: number) => void;
  enterLocation: (locationId: string) => void;
  exitLocation: () => void;
  changeZone: (zone: Zone) => void;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function saveMapState(position: MapPosition, zone: Zone): void {
  try {
    localStorage.setItem(
      MAP_STORAGE_KEY,
      JSON.stringify({ playerPosition: position, currentZone: zone }),
    );
  } catch {
    // ignore
  }
}

function hasActiveBattle(): boolean {
  const battles = useBattleStore.getState().battles;
  for (const battle of battles.values()) {
    if (battle.phase === 'active') return true;
  }
  return false;
}

export const useMapStore = create<MapStore>((set) => ({
  currentZone: 'town',
  currentLocationId: null,
  playerPosition: { x: 4, y: 4 },

  movePlayer: (dx: number, dy: number) => {
    set((state) => {
      const x = clamp(state.playerPosition.x + dx, 0, GRID_MAX_X);
      const y = clamp(state.playerPosition.y + dy, 0, GRID_MAX_Y);
      const position = { x, y };
      saveMapState(position, state.currentZone);
      return { playerPosition: position };
    });
  },

  enterLocation: (locationId: string) => {
    const loc = TOWN_LOCATIONS.find((l) => l.id === locationId);
    if (!loc || !loc.enterable) return;

    const playerLevel = useBattleStore.getState().player.level;
    if (loc.requiresLevel > playerLevel) return;

    if (loc.restrictInBattle && hasActiveBattle()) return;

    set({ currentLocationId: locationId });
  },

  exitLocation: () => {
    set({ currentLocationId: null });
  },

  changeZone: (zone: Zone) => {
    if (hasActiveBattle()) return;
    set({ currentZone: zone });
  },
}));
