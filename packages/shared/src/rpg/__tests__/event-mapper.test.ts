import { describe, expect, it } from 'vitest';
import type { ChatStreamEvent } from '../../types.ts';
import type { ChatContext } from '../event-mapper.ts';
import { mapChatEvent } from '../event-mapper.ts';
import type { ActiveTrap, BattleState, Enemy } from '../types.ts';

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
    isPaused: false,
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

  describe('stasis events (thinking / plan mode)', () => {
    it('maps long thinking to stasis_enter', () => {
      const event: ChatStreamEvent = {
        type: 'thinking',
        data: { content: 'x'.repeat(200) },
      };
      const events = mapChatEvent(event, makeBattleState());
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('stasis_enter');
      expect(events[0].data.reason).toBe('plan_mode');
    });

    it('ignores short thinking content', () => {
      const event: ChatStreamEvent = {
        type: 'thinking',
        data: { content: 'brief thought' },
      };
      const events = mapChatEvent(event, makeBattleState());
      expect(events).toHaveLength(0);
    });

    it('emits stasis_exit on tool_use when paused for plan_mode', () => {
      const event: ChatStreamEvent = {
        type: 'tool_use',
        data: { id: '1', name: 'Read', input: {} },
      };
      const state = makeBattleState({ isPaused: true, pauseReason: 'plan_mode' });
      const events = mapChatEvent(event, state);
      expect(events[0].type).toBe('stasis_exit');
      expect(events[0].data.reason).toBe('plan_mode');
    });

    it('does not emit stasis_exit on tool_use when not paused', () => {
      const event: ChatStreamEvent = {
        type: 'tool_use',
        data: { id: '1', name: 'Read', input: {} },
      };
      const events = mapChatEvent(event, makeBattleState());
      expect(events.every((e) => e.type !== 'stasis_exit')).toBe(true);
    });

    it('includes thinkingLength in stasis_enter data', () => {
      const event: ChatStreamEvent = {
        type: 'thinking',
        data: { content: 'x'.repeat(500) },
      };
      const events = mapChatEvent(event, makeBattleState());
      expect(events[0].data.thinkingLength).toBe(500);
    });
  });

  describe('npc_dialogue events (pending question)', () => {
    it('maps result with pendingQuestion context to npc_dialogue', () => {
      const event: ChatStreamEvent = {
        type: 'result',
        data: { stats: {} },
      };
      const context: ChatContext = {
        pendingQuestion: { question: 'Which approach?', options: ['A', 'B'] },
      };
      const events = mapChatEvent(event, makeBattleState(), context);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('npc_dialogue');
      expect(events[0].data.dialogue).toEqual({
        question: 'Which approach?',
        options: ['A', 'B'],
      });
    });

    it('does not emit victory when pendingQuestion is present', () => {
      const event: ChatStreamEvent = {
        type: 'result',
        data: { stats: {} },
      };
      const context: ChatContext = {
        pendingQuestion: { question: 'Q?', options: ['Y', 'N'] },
      };
      const events = mapChatEvent(event, makeBattleState(), context);
      expect(events.every((e) => e.type !== 'victory')).toBe(true);
    });
  });

  describe('trap_detected events (pending permission)', () => {
    it('maps result with pendingPermission to trap_detected', () => {
      const event: ChatStreamEvent = {
        type: 'result',
        data: { stats: {} },
      };
      const context: ChatContext = {
        pendingPermission: { toolName: 'Bash', description: 'run command' },
      };
      const events = mapChatEvent(event, makeBattleState(), context);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('trap_detected');
      const trap = events[0].data.trap as ActiveTrap;
      expect(trap.toolName).toBe('Bash');
      expect(trap.riskLevel).toBe('high');
    });

    it('classifies Read tool as low risk', () => {
      const event: ChatStreamEvent = {
        type: 'result',
        data: { stats: {} },
      };
      const context: ChatContext = {
        pendingPermission: { toolName: 'Read', description: 'read file' },
      };
      const events = mapChatEvent(event, makeBattleState(), context);
      const trap = events[0].data.trap as ActiveTrap;
      expect(trap.riskLevel).toBe('low');
    });

    it('classifies Edit tool as medium risk', () => {
      const event: ChatStreamEvent = {
        type: 'result',
        data: { stats: {} },
      };
      const context: ChatContext = {
        pendingPermission: { toolName: 'Edit', description: 'edit file' },
      };
      const events = mapChatEvent(event, makeBattleState(), context);
      const trap = events[0].data.trap as ActiveTrap;
      expect(trap.riskLevel).toBe('medium');
    });

    it('does not emit victory when pendingPermission is present', () => {
      const event: ChatStreamEvent = {
        type: 'result',
        data: { stats: {} },
      };
      const context: ChatContext = {
        pendingPermission: { toolName: 'Bash', description: 'run' },
      };
      const events = mapChatEvent(event, makeBattleState(), context);
      expect(events.every((e) => e.type !== 'victory')).toBe(true);
    });

    it('prefers pendingQuestion over pendingPermission when both present', () => {
      const event: ChatStreamEvent = {
        type: 'result',
        data: { stats: {} },
      };
      const context: ChatContext = {
        pendingQuestion: { question: 'Q?', options: ['Y'] },
        pendingPermission: { toolName: 'Bash', description: 'run' },
      };
      const events = mapChatEvent(event, makeBattleState(), context);
      expect(events[0].type).toBe('npc_dialogue');
    });
  });
});
