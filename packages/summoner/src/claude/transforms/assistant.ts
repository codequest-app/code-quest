import type { ContentBlock } from '@code-quest/shared';
import type { ClientMessage } from '../../types.ts';

export function transformAssistant(raw: Record<string, unknown>): ClientMessage | null {
  const parentToolUseId = (raw.parent_tool_use_id as string) ?? undefined;
  const message = raw.message as Record<string, unknown> | undefined;
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

  const uuid = typeof raw.uuid === 'string' ? raw.uuid : undefined;
  return {
    name: 'message:assistant',
    payload: {
      content: blocks,
      ...(parentToolUseId ? { parentToolUseId } : {}),
      ...(uuid ? { uuid } : {}),
    },
  };
}
