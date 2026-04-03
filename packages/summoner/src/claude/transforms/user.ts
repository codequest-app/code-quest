import type { ContentBlock } from '@code-quest/shared';
import type { ClientMessage } from '../../types.ts';

export function transformUser(event: Record<string, unknown>): ClientMessage | null {
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

  const uuid = typeof event.uuid === 'string' ? event.uuid : undefined;
  return {
    name: 'message:user',
    payload: {
      content: blocks,
      ...(parentToolUseId ? { parentToolUseId } : {}),
      ...(uuid ? { uuid } : {}),
    },
  };
}
