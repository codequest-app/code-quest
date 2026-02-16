import type { ChatStreamEvent } from '../types.ts';
import { calculateDamage } from './damage-calculator.ts';
import { generateEnemy } from './enemy-generator.ts';
import { getSkillForTool } from './skill-mapper.ts';
import type {
  ActiveDialogue,
  ActiveTrap,
  BattleEvent,
  BattleState,
  TrapRiskLevel,
} from './types.ts';

export interface ChatContext {
  pendingQuestion?: {
    question: string;
    options: string[];
  };
  pendingPermission?: {
    toolName: string;
    description: string;
  };
}

const THINKING_LENGTH_THRESHOLD = 200;

function classifyToolRisk(toolName: string): TrapRiskLevel {
  const lower = toolName.toLowerCase();
  if (lower.includes('bash') || lower.includes('execute') || lower.includes('shell')) return 'high';
  if (lower.includes('edit') || lower.includes('write') || lower.includes('delete'))
    return 'medium';
  return 'low';
}

export function mapChatEvent(
  event: ChatStreamEvent,
  battleState: BattleState,
  promptOrContext?: string | ChatContext,
): BattleEvent[] {
  const events: BattleEvent[] = [];

  const prompt = typeof promptOrContext === 'string' ? promptOrContext : undefined;
  const context = typeof promptOrContext === 'object' ? promptOrContext : undefined;

  switch (event.type) {
    case 'init': {
      if (prompt) {
        const enemy = generateEnemy(prompt);
        events.push({ type: 'battle_start', data: { enemy, prompt } });
      }
      break;
    }

    case 'thinking': {
      const content = event.data.content;
      if (content.length >= THINKING_LENGTH_THRESHOLD) {
        events.push({
          type: 'stasis_enter',
          data: { reason: 'plan_mode', thinkingLength: content.length },
        });
      }
      break;
    }

    case 'tool_use': {
      // If battle was in stasis from thinking, exit it
      if (battleState.isPaused && battleState.pauseReason === 'plan_mode') {
        events.push({ type: 'stasis_exit', data: { reason: 'plan_mode' } });
      }

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
      // Check context for pending question/permission before victory
      if (context?.pendingQuestion) {
        const dialogue: ActiveDialogue = {
          question: context.pendingQuestion.question,
          options: context.pendingQuestion.options,
        };
        events.push({ type: 'npc_dialogue', data: { dialogue } });
        return events;
      }

      if (context?.pendingPermission) {
        const riskLevel = classifyToolRisk(context.pendingPermission.toolName);
        const trap: ActiveTrap = {
          toolName: context.pendingPermission.toolName,
          description: context.pendingPermission.description,
          riskLevel,
        };
        events.push({ type: 'trap_detected', data: { trap } });
        return events;
      }

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
