import { describe, expect, it } from 'vitest';
import type { ChatStreamEvent } from '../../types.ts';
import { mapChatEvent } from '../event-mapper.ts';
import type { BattleState, Enemy } from '../types.ts';

function makeBattleState(overrides: Partial<BattleState> = {}): BattleState {
  const enemy: Enemy = {
    name: 'Bug Slime',
    type: 'bug-hunt',
    level: 3,
    hp: 300,
    maxHp: 300,
  };
  return {
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
    ...overrides,
  };
}

describe('mapChatEvent', () => {
  it('maps tool_use to skill_cast and damage events', () => {
    const event: ChatStreamEvent = {
      type: 'tool_use',
      data: { id: '1', name: 'Read', input: {} },
    };
    const events = mapChatEvent(event, makeBattleState());
    const types = events.map((e) => e.type);
    expect(types).toContain('skill_cast');
    expect(types).toContain('damage');
  });

  it('maps result to victory event', () => {
    const event: ChatStreamEvent = {
      type: 'result',
      data: { stats: {} },
    };
    const events = mapChatEvent(event, makeBattleState());
    const types = events.map((e) => e.type);
    expect(types).toContain('victory');
  });

  it('maps error to enemy_counter event', () => {
    const event: ChatStreamEvent = {
      type: 'error',
      data: { message: 'something failed' },
    };
    const events = mapChatEvent(event, makeBattleState());
    expect(events.some((e) => e.type === 'enemy_counter')).toBe(true);
  });

  it('returns empty for text events', () => {
    const event: ChatStreamEvent = {
      type: 'text',
      data: { content: 'hello' },
    };
    const events = mapChatEvent(event, makeBattleState());
    expect(events).toEqual([]);
  });

  it('returns empty for thinking events', () => {
    const event: ChatStreamEvent = {
      type: 'thinking',
      data: { content: 'pondering...' },
    };
    const events = mapChatEvent(event, makeBattleState());
    expect(events).toEqual([]);
  });

  it('detects combo when comboCount > 0', () => {
    const event: ChatStreamEvent = {
      type: 'tool_use',
      data: { id: '2', name: 'Edit', input: {} },
    };
    const state = makeBattleState({ comboCount: 2 });
    const events = mapChatEvent(event, state);
    expect(events.some((e) => e.type === 'combo')).toBe(true);
  });

  it('maps result with gold_earned and exp_earned', () => {
    const event: ChatStreamEvent = {
      type: 'result',
      data: { stats: { durationMs: 5000 } },
    };
    const events = mapChatEvent(event, makeBattleState());
    const types = events.map((e) => e.type);
    expect(types).toContain('gold_earned');
    expect(types).toContain('exp_earned');
  });

  it('generates battle_start from init with prompt', () => {
    const event: ChatStreamEvent = {
      type: 'init',
      data: { sessionId: 'abc' },
    };
    const events = mapChatEvent(event, makeBattleState(), 'fix the login bug');
    expect(events.some((e) => e.type === 'battle_start')).toBe(true);
  });
});
