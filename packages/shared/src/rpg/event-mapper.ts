import type { ChatStreamEvent } from '../types.ts';
import { calculateDamage } from './damage-calculator.ts';
import { generateEnemy } from './enemy-generator.ts';
import { getSkillForTool } from './skill-mapper.ts';
import type { BattleEvent, BattleState } from './types.ts';

export function mapChatEvent(
  event: ChatStreamEvent,
  battleState: BattleState,
  prompt?: string,
): BattleEvent[] {
  const events: BattleEvent[] = [];

  switch (event.type) {
    case 'init': {
      if (prompt) {
        const enemy = generateEnemy(prompt);
        events.push({ type: 'battle_start', data: { enemy, prompt } });
      }
      break;
    }

    case 'tool_use': {
      const skill = getSkillForTool(event.data.name);
      events.push({ type: 'skill_cast', data: { skill, toolName: event.data.name } });

      const damage = calculateDamage(skill, battleState.enemy, battleState.playerLevel);
      events.push({ type: 'damage', data: { damage, skill } });

      events.push({ type: 'mp_consumed', data: { amount: skill.mpCost } });

      if (battleState.comboCount > 0) {
        const bonus = 1 + battleState.comboCount * 0.1;
        events.push({ type: 'combo', data: { count: battleState.comboCount + 1, bonus } });
      }
      break;
    }

    case 'result': {
      events.push({ type: 'victory', data: { stats: event.data.stats } });

      const goldBase = battleState.enemy.level * 50;
      events.push({ type: 'gold_earned', data: { amount: goldBase } });

      const expBase = battleState.enemy.level * 30;
      events.push({ type: 'exp_earned', data: { amount: expBase } });
      break;
    }

    case 'error': {
      events.push({
        type: 'enemy_counter',
        data: { message: event.data.message, damage: 10 },
      });
      break;
    }

    default:
      break;
  }

  return events;
}
