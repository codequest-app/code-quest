import type { ContentBlock } from '@code-quest/shared';
import type { z } from 'zod';
import type { ClientMessage } from '../../types.ts';
import type { assistantSchema } from '../schemas.ts';

type AssistantMessage = z.infer<typeof assistantSchema>;

export function transformAssistant(raw: AssistantMessage): ClientMessage | null {
  const parentToolUseId = raw.parent_tool_use_id ?? undefined;
  const message = raw.message;
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
