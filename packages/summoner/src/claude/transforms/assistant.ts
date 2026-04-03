import type { ContentBlock } from '@code-quest/shared';
import type { SocketEvent } from '../../types.ts';

export function transformAssistantEvent(event: Record<string, unknown>): SocketEvent | null {
  const parentToolUseId = (event.parent_tool_use_id as string) ?? undefined;
  const message = event.message as Record<string, unknown> | undefined;
  const content = message?.content;
  if (!Array.isArray(content)) return null;

  const blocks: ContentBlock[] = [];
  for (const b of content) {
    switch (b.type) {
      case 'text':
        blocks.push({ type: 'text', text: String(b.text ?? '') });
        break;
      case 'thinking':
        blocks.push({ type: 'thinking', thinking: String(b.thinking ?? '') });
        break;
      case 'tool_use':
        blocks.push({
          type: 'tool_use',
          toolId: String(b.id ?? ''),
          toolName: String(b.name ?? ''),
          input: b.input,
        });
        break;
    }
  }

  const uuid = typeof event.uuid === 'string' ? event.uuid : undefined;
  return {
    name: 'message:assistant',
    payload: {
      content: blocks,
      ...(parentToolUseId ? { parentToolUseId } : {}),
      ...(uuid ? { uuid } : {}),
    },
  };
}
