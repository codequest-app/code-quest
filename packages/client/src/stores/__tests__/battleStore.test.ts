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
    useBattleStore.setState({ battles: new Map() });
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
});
