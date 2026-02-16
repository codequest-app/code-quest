import type { Enemy } from '@code-quest/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { useBattleStore } from '../battleStore';

const makeEnemy = (overrides: Partial<Enemy> = {}): Enemy => ({
  name: 'Bug Slime',
  type: 'bug-hunt',
  level: 3,
  hp: 300,
  maxHp: 300,
  ...overrides,
});

describe('battleStore', () => {
  beforeEach(() => {
    useBattleStore.setState({
      battles: new Map(),
      prompts: new Map(),
      player: { level: 1, totalExp: 0, totalGold: 0 },
    });
  });

  it('starts a battle for a session', () => {
    const store = useBattleStore.getState();
    store.startBattle('s1', makeEnemy());

    const battle = store.getBattle('s1');
    expect(battle).toBeDefined();
    expect(battle?.enemy.name).toBe('Bug Slime');
    expect(battle?.phase).toBe('active');
  });

  it('updates enemy HP', () => {
    const store = useBattleStore.getState();
    store.startBattle('s1', makeEnemy());
    useBattleStore.getState().updateEnemy('s1', { hp: 200 });

    const battle = useBattleStore.getState().getBattle('s1');
    expect(battle?.enemy.hp).toBe(200);
  });

  it('adds log entries', () => {
    const store = useBattleStore.getState();
    store.startBattle('s1', makeEnemy());
    useBattleStore.getState().addLogEntry('s1', {
      id: 'log1',
      timestamp: Date.now(),
      message: 'Battle started!',
      type: 'info',
    });

    const battle = useBattleStore.getState().getBattle('s1');
    expect(battle?.log).toHaveLength(1);
    expect(battle?.log[0].message).toBe('Battle started!');
  });

  it('ends battle with victory', () => {
    const store = useBattleStore.getState();
    store.startBattle('s1', makeEnemy());
    useBattleStore.getState().endBattle('s1', 'victory');

    const battle = useBattleStore.getState().getBattle('s1');
    expect(battle?.phase).toBe('victory');
  });

  it('returns undefined for non-existent battle', () => {
    expect(useBattleStore.getState().getBattle('nope')).toBeUndefined();
  });

  it('stores and retrieves prompts', () => {
    useBattleStore.getState().setPrompt('s1', 'fix the bug');
    expect(useBattleStore.getState().getPrompt('s1')).toBe('fix the bug');
  });

  describe('processBattleEvent', () => {
    beforeEach(() => {
      useBattleStore.getState().startBattle('s1', makeEnemy());
    });

    it('processes battle_start event', () => {
      useBattleStore.getState().processBattleEvent('s1', {
        type: 'battle_start',
        data: { enemy: makeEnemy(), prompt: 'fix bug' },
      });
      const battle = useBattleStore.getState().getBattle('s1');
      expect(battle?.log.some((l) => l.message.includes('現れた'))).toBe(true);
    });

    it('processes skill_cast event', () => {
      useBattleStore.getState().processBattleEvent('s1', {
        type: 'skill_cast',
        data: { skill: { name: 'Read', japaneseName: '讀心術', category: 'read', mpCost: 3 } },
      });
      const battle = useBattleStore.getState().getBattle('s1');
      expect(battle?.log.some((l) => l.type === 'skill')).toBe(true);
      expect(battle?.comboCount).toBe(1);
    });

    it('processes damage event reducing enemy HP', () => {
      useBattleStore.getState().processBattleEvent('s1', {
        type: 'damage',
        data: {
          damage: { baseDamage: 100, affinityMultiplier: 1.5, totalDamage: 150, isCritical: true },
        },
      });
      const battle = useBattleStore.getState().getBattle('s1');
      expect(battle?.enemy.hp).toBe(150); // 300 - 150
      expect(battle?.log.some((l) => l.message.includes('会心'))).toBe(true);
    });

    it('processes mp_consumed event', () => {
      useBattleStore.getState().processBattleEvent('s1', {
        type: 'mp_consumed',
        data: { amount: 10 },
      });
      const battle = useBattleStore.getState().getBattle('s1');
      expect(battle?.playerMp).toBe(40);
    });

    it('processes victory event', () => {
      useBattleStore.getState().processBattleEvent('s1', {
        type: 'victory',
        data: { stats: {} },
      });
      const battle = useBattleStore.getState().getBattle('s1');
      expect(battle?.phase).toBe('victory');
    });

    it('processes exp_earned and updates player state', () => {
      useBattleStore.getState().processBattleEvent('s1', {
        type: 'exp_earned',
        data: { amount: 90 },
      });
      const battle = useBattleStore.getState().getBattle('s1');
      expect(battle?.expEarned).toBe(90);
      expect(useBattleStore.getState().player.totalExp).toBe(90);
    });

    it('processes gold_earned and updates player state', () => {
      useBattleStore.getState().processBattleEvent('s1', {
        type: 'gold_earned',
        data: { amount: 150 },
      });
      const battle = useBattleStore.getState().getBattle('s1');
      expect(battle?.goldEarned).toBe(150);
      expect(useBattleStore.getState().player.totalGold).toBe(150);
    });

    it('levels up player when exp threshold reached', () => {
      useBattleStore.getState().processBattleEvent('s1', {
        type: 'exp_earned',
        data: { amount: 200 },
      });
      expect(useBattleStore.getState().player.level).toBe(3);
    });

    it('processes enemy_counter event', () => {
      useBattleStore.getState().processBattleEvent('s1', {
        type: 'enemy_counter',
        data: { message: 'error occurred', damage: 15 },
      });
      const battle = useBattleStore.getState().getBattle('s1');
      expect(battle?.playerHp).toBe(85);
      expect(battle?.log.some((l) => l.type === 'error')).toBe(true);
    });
  });
});
