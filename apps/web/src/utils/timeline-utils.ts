import type { AssistantTurn, Message } from '@/types/ui';
import { AGENT_TOOLS } from './tool-utils';

export type TimelineRun =
  | { kind: 'grouped'; messages: Message[] }
  | { kind: 'solo'; message: Message };

export interface GroupChip {
  label: string;
  count?: number;
  isError: boolean;
}

function isToolUseMessage(message: Message): boolean {
  if (message.type === 'tool_use') return true;
  if (message.type === 'assistant_turn') {
    const turn = message as AssistantTurn;
    const hasText = turn.blocks.some((b) => b.type === 'text');
    if (hasText) return false;
    return turn.blocks.some((b) => b.type === 'tool_use');
  }
  return false;
}

function getToolUseMeta(message: Message):
  | {
      content: string;
      toolId?: string;
      input?: Record<string, unknown>;
      result?: { is_error?: boolean };
    }
  | undefined {
  if (message.type === 'tool_use') {
    return {
      content: message.content,
      toolId: message.toolId,
      input: message.input,
      result: message.result,
    };
  }
  if (message.type === 'assistant_turn') {
    const turn = message as AssistantTurn;
    const toolBlock = turn.blocks.find((b) => b.type === 'tool_use');
    if (toolBlock) {
      return {
        content: toolBlock.content,
        toolId: toolBlock.toolId,
        input: toolBlock.input,
      };
    }
  }
  return undefined;
}

function isPermissionMessage(message: Message): boolean {
  return message.type === 'action_result' || message.type === 'pending_action';
}

function flushPending(pending: Message[]): TimelineRun[] {
  if (pending.length === 0) return [];
  if (pending.length === 1 && pending[0]) return [{ kind: 'solo', message: pending[0] }];
  return [{ kind: 'grouped', messages: pending }];
}

export function splitTimelineRuns(messages: Message[]): TimelineRun[] {
  const runs: TimelineRun[] = [];
  let pending: Message[] = [];
  for (const message of messages) {
    if (isToolUseMessage(message) || isPermissionMessage(message)) {
      pending.push(message);
    } else {
      if (pending.length > 0) {
        runs.push(...flushPending(pending));
        pending = [];
      }
      runs.push({ kind: 'solo', message });
    }
  }
  if (pending.length > 0) runs.push(...flushPending(pending));
  return runs;
}

function skillChipLabel(skillName: string): string {
  return `/${skillName.split(':').at(-1) ?? skillName}`;
}

function strFromInput(
  input: Record<string, unknown> | undefined,
  key: string,
  fallback: string,
): string {
  return typeof input?.[key] === 'string' ? (input[key] as string) : fallback;
}

export function buildGroupChips(messages: Message[]): GroupChip[] {
  const chips: GroupChip[] = [];
  const generic = new Map<string, GroupChip>();

  for (const message of messages) {
    const toolInfo = getToolUseMeta(message);
    if (!toolInfo) continue;
    const toolName = toolInfo.content;
    if (!toolName) continue;
    const isError = toolInfo.result?.is_error === true;

    if (toolName === 'Skill') {
      const skillName = strFromInput(toolInfo.input, 'skill', 'skill');
      chips.push({ label: skillChipLabel(skillName), isError });
    } else if (AGENT_TOOLS.has(toolName)) {
      chips.push({ label: strFromInput(toolInfo.input, 'description', 'Agent'), isError });
    } else {
      const chip = generic.get(toolName);
      if (chip) {
        chip.count = (chip.count ?? 1) + 1;
        if (isError) chip.isError = true;
      } else {
        const newChip: GroupChip = { label: toolName, count: 1, isError };
        generic.set(toolName, newChip);
        chips.push(newChip);
      }
    }
  }

  return chips;
}
