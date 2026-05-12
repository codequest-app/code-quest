import { VISIBILITY_GROUPS } from '@/contexts/channel/MessageVisibilityContext';
import type { AssistantTurn, Message } from '@/types/ui';

/** Subtype keys (format: "type:toolName") that are controlled independently via VISIBILITY_GROUPS */
const SUBTYPE_OVERRIDES = new Set(
  VISIBILITY_GROUPS.flatMap((g) => g.types).filter((t) => t.includes(':')),
);

function toolSubKey(type: string, toolName: string): string {
  return `${type}:${toolName}`;
}

export function isMessageVisible(message: Message, enabledTypes: Set<string>): boolean {
  if (message.type === 'assistant_turn') {
    const turn = message as AssistantTurn;
    if (turn.blocks.length === 0) return enabledTypes.has('assistant_turn');
    return turn.blocks.some((block) => {
      if (block.type === 'tool_use') {
        const subKey = toolSubKey('tool_use', block.content);
        if (SUBTYPE_OVERRIDES.has(subKey)) return enabledTypes.has(subKey);
        return enabledTypes.has('tool_use');
      }
      return enabledTypes.has(block.type);
    });
  }
  const subKey = toolSubKey(message.type, message.content);
  if (SUBTYPE_OVERRIDES.has(subKey)) return enabledTypes.has(subKey);
  return enabledTypes.has(message.type);
}
