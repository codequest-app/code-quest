import type {
  BattleEvent,
  BattleLogEntry,
  BattlePhase,
  BattleState,
  DamageResult,
  Enemy,
  SkillInfo,
} from '@code-quest/shared';
import { create } from 'zustand';

let logCounter = 0;
function nextLogId(): string {
  return `log-${++logCounter}`;
}

function makeLogEntry(message: string, type: BattleLogEntry['type']): BattleLogEntry {
  return { id: nextLogId(), timestamp: Date.now(), message, type };
}

interface PlayerState {
  level: number;
  totalExp: number;
  totalGold: number;
}

interface BattleStore {
  battles: Map<string, BattleState>;
  prompts: Map<string, string>;
  player: PlayerState;

  startBattle: (sessionId: string, enemy: Enemy) => void;
  updateEnemy: (sessionId: string, updates: Partial<Enemy>) => void;
  addLogEntry: (sessionId: string, entry: BattleLogEntry) => void;
  endBattle: (sessionId: string, phase: BattlePhase) => void;
  getBattle: (sessionId: string) => BattleState | undefined;
  updateBattle: (sessionId: string, updates: Partial<BattleState>) => void;
  setPrompt: (sessionId: string, prompt: string) => void;
  getPrompt: (sessionId: string) => string | undefined;
  processBattleEvent: (sessionId: string, event: BattleEvent) => void;
}

const PLAYER_STORAGE_KEY = 'code-quest-player';

function loadPlayerState(): PlayerState {
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed.level === 'number' &&
        typeof parsed.totalExp === 'number' &&
        typeof parsed.totalGold === 'number'
      ) {
        return parsed as PlayerState;
      }
    }
  } catch {
    // ignore corrupt data
  }
  return { level: 1, totalExp: 0, totalGold: 0 };
}

function savePlayerState(player: PlayerState): void {
  try {
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
  } catch {
    // ignore quota errors
  }
}

export const useBattleStore = create<BattleStore>((set, get) => ({
  battles: new Map(),
  prompts: new Map(),
  player: loadPlayerState(),

  startBattle: (sessionId: string, enemy: Enemy) => {
    set((state) => {
      const battles = new Map(state.battles);
      battles.set(sessionId, {
        enemy,
        phase: 'active',
        playerLevel: state.player.level,
        playerHp: 100,
        playerMaxHp: 100,
        playerMp: 50,
        playerMaxMp: 50,
        playerExp: state.player.totalExp,
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

  setPrompt: (sessionId: string, prompt: string) => {
    set((state) => {
      const prompts = new Map(state.prompts);
      prompts.set(sessionId, prompt);
      return { prompts };
    });
  },

  getPrompt: (sessionId: string) => {
    return get().prompts.get(sessionId);
  },

  processBattleEvent: (sessionId: string, event: BattleEvent) => {
    set((state) => {
      const battles = new Map(state.battles);
      const battle = battles.get(sessionId);
      if (!battle) return state;

      const updated = { ...battle };
      const log = [...battle.log];

      switch (event.type) {
        case 'battle_start': {
          // Already handled by startBattle
          const enemy = event.data.enemy as Enemy;
          log.push(makeLogEntry(`${enemy.name} が現れた！`, 'info'));
          updated.log = log;
          break;
        }

        case 'skill_cast': {
          const skill = event.data.skill as SkillInfo;
          log.push(makeLogEntry(`${skill.japaneseName}（${skill.name}）を唱えた！`, 'skill'));
          updated.log = log;
          updated.comboCount = battle.comboCount + 1;
          break;
        }

        case 'damage': {
          const damage = event.data.damage as DamageResult;
          const newHp = Math.max(0, battle.enemy.hp - damage.totalDamage);
          updated.enemy = { ...battle.enemy, hp: newHp };
          const critText = damage.isCritical ? '会心の一撃！ ' : '';
          log.push(makeLogEntry(`${critText}${damage.totalDamage} のダメージ！`, 'damage'));
          updated.log = log;
          break;
        }

        case 'mp_consumed': {
          const amount = event.data.amount as number;
          updated.playerMp = Math.max(0, battle.playerMp - amount);
          break;
        }

        case 'combo': {
          const count = event.data.count as number;
          log.push(makeLogEntry(`${count} コンボ！`, 'info'));
          updated.log = log;
          break;
        }

        case 'enemy_counter': {
          const counterDamage = event.data.damage as number;
          updated.playerHp = Math.max(0, battle.playerHp - counterDamage);
          const msg = event.data.message as string;
          log.push(makeLogEntry(`${battle.enemy.name} の反撃！ ${msg}`, 'error'));
          updated.log = log;
          break;
        }

        case 'victory': {
          updated.phase = 'victory';
          log.push(makeLogEntry(`${battle.enemy.name} を倒した！`, 'victory'));
          updated.log = log;
          break;
        }

        case 'gold_earned': {
          const gold = event.data.amount as number;
          updated.goldEarned = battle.goldEarned + gold;
          log.push(makeLogEntry(`${gold} ゴールド を手に入れた！`, 'info'));
          updated.log = log;
          break;
        }

        case 'exp_earned': {
          const exp = event.data.amount as number;
          updated.expEarned = battle.expEarned + exp;
          updated.playerExp = battle.playerExp + exp;
          log.push(makeLogEntry(`${exp} 経験値 を獲得！`, 'info'));
          updated.log = log;
          break;
        }
      }

      battles.set(sessionId, updated);

      // Update persistent player state on victory
      let player = state.player;
      if (event.type === 'exp_earned') {
        const exp = event.data.amount as number;
        const newTotalExp = state.player.totalExp + exp;
        const newLevel = Math.max(1, Math.floor(newTotalExp / 100) + 1);
        player = { ...state.player, totalExp: newTotalExp, level: newLevel };
      }
      if (event.type === 'gold_earned') {
        const gold = event.data.amount as number;
        player = { ...player, totalGold: player.totalGold + gold };
      }

      if (player !== state.player) {
        savePlayerState(player);
      }

      return { battles, player };
    });
  },
}));
