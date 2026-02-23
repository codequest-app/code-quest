import type {
  EncounterResult,
  LocationDef,
  MapPosition,
  WildernessSubZoneId,
  Zone,
} from '@code-quest/shared';
import {
  DUNGEON_LOCATIONS,
  generateEnemy,
  shouldTriggerEncounter,
  TOWN_LOCATIONS,
  WILDERNESS_LOCATIONS,
  WILDERNESS_SUB_ZONES,
} from '@code-quest/shared';
import { create } from 'zustand';
import { useBattleStore } from './battleStore';

const ZONE_LOCATIONS: Record<Zone, LocationDef[]> = {
  town: TOWN_LOCATIONS,
  wilderness: WILDERNESS_LOCATIONS,
  dungeon: DUNGEON_LOCATIONS,
};

const MAP_STORAGE_KEY = 'code-quest-map';
const GRID_MAX_X = 9;
const GRID_MAX_Y = 7;

interface MapStore {
  currentZone: Zone;
  currentLocationId: string | null;
  playerPosition: MapPosition;
  lastEncounter: EncounterResult | null;
  pendingEncounter: boolean;
  inDungeon: boolean;
  planModeActive: boolean;
  setPlanMode: (active: boolean) => void;
  movePlayer: (dx: number, dy: number) => void;
  enterLocation: (locationId: string) => void;
  exitLocation: () => void;
  changeZone: (zone: Zone) => void;
  checkEncounter: (prompt: string) => EncounterResult;
  triggerBattle: (prompt: string) => string | null;
  restoreFromStorage: () => void;
  getCurrentSubZone: () => WildernessSubZoneId | null;
  dismissEncounter: () => void;
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

function findSubZone(position: MapPosition): WildernessSubZoneId {
  const loc = WILDERNESS_LOCATIONS.find(
    (l) => l.position.x === position.x && l.position.y === position.y,
  );
  if (loc) {
    const sub = WILDERNESS_SUB_ZONES.find((z) => z.id === loc.id);
    if (sub) return sub.id;
  }
  return 'forest';
}

function hasActiveBattle(): boolean {
  const battles = useBattleStore.getState().battles;
  for (const battle of battles.values()) {
    if (battle.phase === 'active') return true;
  }
  return false;
}

export const useMapStore = create<MapStore>((set, get) => ({
  currentZone: 'town',
  currentLocationId: null,
  playerPosition: { x: 4, y: 4 },
  lastEncounter: null,
  pendingEncounter: false,
  inDungeon: false,
  planModeActive: false,

  setPlanMode: (active: boolean) => {
    set({ planModeActive: active });
  },

  movePlayer: (dx: number, dy: number) => {
    set((state) => {
      const x = clamp(state.playerPosition.x + dx, 0, GRID_MAX_X);
      const y = clamp(state.playerPosition.y + dy, 0, GRID_MAX_Y);
      const position = { x, y };
      saveMapState(position, state.currentZone);

      let pending = false;
      if (state.currentZone === 'wilderness') {
        const subZone = findSubZone(position);
        const subZoneDef = WILDERNESS_SUB_ZONES.find((z) => z.id === subZone);
        const rate = subZoneDef?.encounterRate ?? 0.3;
        if (Math.random() < rate) {
          pending = true;
        }
      }

      return { playerPosition: position, pendingEncounter: pending };
    });
  },

  enterLocation: (locationId: string) => {
    const zone = get().currentZone;
    const loc = ZONE_LOCATIONS[zone].find((l: LocationDef) => l.id === locationId);
    if (!loc || !loc.enterable) return;

    const playerLevel = useBattleStore.getState().player.level;
    if (loc.requiresLevel > playerLevel) return;

    if (loc.restrictInBattle && hasActiveBattle()) return;

    const isDungeon = loc.zone === 'dungeon';
    set({ currentLocationId: locationId, ...(isDungeon ? { inDungeon: true } : {}) });
  },

  exitLocation: () => {
    set({ currentLocationId: null, inDungeon: false });
  },

  changeZone: (zone: Zone) => {
    if (hasActiveBattle()) return;
    if (get().inDungeon) return;
    set({ currentZone: zone });
  },

  checkEncounter: (prompt: string): EncounterResult => {
    const { currentZone, playerPosition } = get();
    const subZone = findSubZone(playerPosition);
    const result = shouldTriggerEncounter(prompt, currentZone, subZone);
    set({ lastEncounter: result });
    return result;
  },

  triggerBattle: (prompt: string): string | null => {
    const result = get().checkEncounter(prompt);
    if (!result.trigger) return null;

    const enemy = generateEnemy(prompt);
    const sessionId = `battle-${Date.now()}`;
    useBattleStore.getState().startBattle(sessionId, enemy);
    return sessionId;
  },

  restoreFromStorage: () => {
    try {
      const raw = localStorage.getItem(MAP_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        const updates: Partial<MapStore> = {};
        if (data.playerPosition) updates.playerPosition = data.playerPosition;
        if (data.currentZone) updates.currentZone = data.currentZone;
        set(updates);
      }
    } catch {
      // ignore
    }
  },

  dismissEncounter: () => {
    set({ pendingEncounter: false });
  },

  getCurrentSubZone: (): WildernessSubZoneId | null => {
    const { currentZone, playerPosition } = get();
    if (currentZone !== 'wilderness') return null;
    return findSubZone(playerPosition);
  },
}));
