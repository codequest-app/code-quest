import type { AssistantTurn, Message } from '@/types/ui';

function findToolUseBlock(
  message: Message,
): (AssistantTurn['blocks'][number] & { type: 'tool_use' }) | undefined {
  if (message.type !== 'assistant_turn') return undefined;
  const turn = message as AssistantTurn;
  return turn.blocks.find((b) => b.type === 'tool_use') as
    | (AssistantTurn['blocks'][number] & { type: 'tool_use' })
    | undefined;
}

export function getToolId(message: Message): string | undefined {
  if (message.type === 'tool_use') return message.toolId;
  return findToolUseBlock(message)?.toolId;
}

export function getModel(message: Message): string | undefined {
  if (message.type === 'tool_use') return message.model;
  if (message.type === 'assistant_turn') {
    const turn = message as AssistantTurn;
    const toolBlock = findToolUseBlock(message);
    return toolBlock?.model ?? turn.model;
  }
  return undefined;
}
