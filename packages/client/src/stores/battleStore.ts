import type { BattleLogEntry, BattlePhase, BattleState, Enemy } from '@code-quest/shared';
import { create } from 'zustand';

interface BattleStore {
  battles: Map<string, BattleState>;

  startBattle: (sessionId: string, enemy: Enemy) => void;
  updateEnemy: (sessionId: string, updates: Partial<Enemy>) => void;
  addLogEntry: (sessionId: string, entry: BattleLogEntry) => void;
  endBattle: (sessionId: string, phase: BattlePhase) => void;
  getBattle: (sessionId: string) => BattleState | undefined;
  updateBattle: (sessionId: string, updates: Partial<BattleState>) => void;
}

export const useBattleStore = create<BattleStore>((set, get) => ({
  battles: new Map(),

  startBattle: (sessionId: string, enemy: Enemy) => {
    set((state) => {
      const battles = new Map(state.battles);
      battles.set(sessionId, {
        enemy,
        phase: 'active',
        playerLevel: 1,
        playerHp: 100,
        playerMaxHp: 100,
        playerMp: 50,
        playerMaxMp: 50,
        playerExp: 0,
        comboCount: 0,
        log: [],
        goldEarned: 0,
        expEarned: 0,
      });
      return { battles };
    });
  },

  updateEnemy: (sessionId: string, updates: Partial<Enemy>) => {
    set((state) => {
      const battles = new Map(state.battles);
      const battle = battles.get(sessionId);
      if (!battle) return state;

      battles.set(sessionId, {
        ...battle,
        enemy: { ...battle.enemy, ...updates },
      });
      return { battles };
    });
  },

  addLogEntry: (sessionId: string, entry: BattleLogEntry) => {
    set((state) => {
      const battles = new Map(state.battles);
      const battle = battles.get(sessionId);
      if (!battle) return state;

      battles.set(sessionId, {
        ...battle,
        log: [...battle.log, entry],
      });
      return { battles };
    });
  },

  endBattle: (sessionId: string, phase: BattlePhase) => {
    set((state) => {
      const battles = new Map(state.battles);
      const battle = battles.get(sessionId);
      if (!battle) return state;

      battles.set(sessionId, { ...battle, phase });
      return { battles };
    });
  },

  getBattle: (sessionId: string) => {
    return get().battles.get(sessionId);
  },

  updateBattle: (sessionId: string, updates: Partial<BattleState>) => {
    set((state) => {
      const battles = new Map(state.battles);
      const battle = battles.get(sessionId);
      if (!battle) return state;

      battles.set(sessionId, { ...battle, ...updates });
      return { battles };
    });
  },
}));
