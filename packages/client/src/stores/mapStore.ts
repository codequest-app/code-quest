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

export interface MapNpcData {
  name: string;
  icon: string;
  dialogue: string;
}

const WANDERING_NPCS: MapNpcData[] = [
  { name: 'Wandering Sage', icon: '🧙', dialogue: 'Beware of the volcano region, young coder.' },
  {
    name: 'Lost Traveler',
    icon: '🧳',
    dialogue: 'I once found a rare skill scroll in the mountains.',
  },
  {
    name: 'Forest Spirit',
    icon: '🌿',
    dialogue: 'The forest holds secrets for those who read carefully.',
  },
  { name: 'Old Knight', icon: '🛡️', dialogue: 'Always write tests before you charge into battle.' },
  { name: 'Merchant Cat', icon: '🐱', dialogue: 'Meow... I mean, check the shops for deals!' },
];

const NPC_ENCOUNTER_RATE = 0.1;

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
  completedDungeons: Set<string>;
  activeBattleSessionId: string | null;
  pendingNpc: MapNpcData | null;
  setPlanMode: (active: boolean) => void;
  dismissNpc: () => void;
  onBattleEnd: (locationId: string, victory: boolean) => void;
  movePlayer: (dx: number, dy: number) => void;
  enterLocation: (locationId: string) => void;
  exitLocation: () => void;
  changeZone: (zone: Zone) => void;
  checkEncounter: (prompt: string) => EncounterResult;
  triggerBattle: (prompt: string) => string | null;
  forceBattle: (prompt: string) => string;
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
  completedDungeons: new Set<string>(),
  activeBattleSessionId: null,
  pendingNpc: null,

  setPlanMode: (active: boolean) => {
    set({ planModeActive: active });
  },

  dismissNpc: () => {
    set({ pendingNpc: null });
  },

  onBattleEnd: (locationId: string, victory: boolean) => {
    const updates: Partial<MapStore> = {
      inDungeon: false,
      currentLocationId: null,
      activeBattleSessionId: null,
    };
    if (victory) {
      const completed = new Set(get().completedDungeons);
      completed.add(locationId);
      updates.completedDungeons = completed;
    }
    set(updates);
  },

  movePlayer: (dx: number, dy: number) => {
    set((state) => {
      const x = clamp(state.playerPosition.x + dx, 0, GRID_MAX_X);
      const y = clamp(state.playerPosition.y + dy, 0, GRID_MAX_Y);
      const position = { x, y };
      saveMapState(position, state.currentZone);

      let pending = false;
      let npc: MapNpcData | null = null;
      if (state.currentZone === 'wilderness' && !state.planModeActive) {
        const subZone = findSubZone(position);
        const subZoneDef = WILDERNESS_SUB_ZONES.find((z) => z.id === subZone);
        const rate = subZoneDef?.encounterRate ?? 0.3;
        const roll = Math.random();
        if (roll < NPC_ENCOUNTER_RATE) {
          npc = WANDERING_NPCS[Math.floor(Math.random() * WANDERING_NPCS.length)];
        } else if (roll < rate) {
          pending = true;
        }
      }

      return { playerPosition: position, pendingEncounter: pending, pendingNpc: npc };
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
    if (get().planModeActive) return;
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
    set({ activeBattleSessionId: sessionId });
    useBattleStore.getState().startBattle(sessionId, enemy);
    return sessionId;
  },

  forceBattle: (prompt: string): string => {
    const enemy = generateEnemy(prompt);
    const sessionId = `battle-${Date.now()}`;
    set({ activeBattleSessionId: sessionId });
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

// Auto-restore persisted state on load
useMapStore.getState().restoreFromStorage();

// Subscribe to battleStore — auto-call onBattleEnd when a tracked battle ends
useBattleStore.subscribe((state, prev) => {
  const sessionId = useMapStore.getState().activeBattleSessionId;
  if (!sessionId) return;

  const battle = state.battles.get(sessionId);
  const prevBattle = prev.battles.get(sessionId);
  if (!battle || !prevBattle) return;
  if (battle.phase === prevBattle.phase) return;

  if (battle.phase === 'victory' || battle.phase === 'defeat') {
    const locationId = useMapStore.getState().currentLocationId;
    if (locationId) {
      useMapStore.getState().onBattleEnd(locationId, battle.phase === 'victory');
    }
  }
});
