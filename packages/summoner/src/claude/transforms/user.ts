import type { ContentBlock } from '@code-quest/shared';
import type { z } from 'zod';
import type { ClientMessage } from '../../types.ts';
import type { userSchema } from '../schemas.ts';

type UserMessage = z.infer<typeof userSchema>;

export function transformUser(raw: UserMessage): ClientMessage | null {
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
      case 'tool_result':
        blocks.push({
          type: 'tool_result',
          toolUseId: String(b.tool_use_id ?? ''),
          toolName: typeof b.name === 'string' ? b.name : undefined,
          content: b.content,
        });
        break;
    }
  }

  const uuid = typeof raw.uuid === 'string' ? raw.uuid : undefined;
  return {
    name: 'message:user',
    payload: {
      content: blocks,
      ...(parentToolUseId ? { parentToolUseId } : {}),
      ...(uuid ? { uuid } : {}),
    },
  };
}
