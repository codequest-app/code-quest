import type { ClientMessage, ContentBlock } from '@code-quest/shared';
import type { z } from 'zod';
import { asString } from '../../utils.ts';
import type { assistantSchema } from '../schemas.ts';
import { buildMessagePayload } from './helpers.ts';

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
        blocks.push({ type: 'text', text: asString(b.text, '') });
        break;
      case 'thinking':
        blocks.push({ type: 'thinking', thinking: asString(b.thinking, '') });
        break;
      case 'tool_use':
        blocks.push({
          type: 'tool_use',
          toolId: asString(b.id, ''),
          toolName: asString(b.name, ''),
          input: b.input,
          ...(message.model ? { model: message.model } : {}),
        });
        break;
    }
  }

  const uuid = typeof raw.uuid === 'string' ? raw.uuid : undefined;
  return {
    name: 'message:assistant',
    payload: buildMessagePayload(blocks, parentToolUseId, uuid),
  };
}
