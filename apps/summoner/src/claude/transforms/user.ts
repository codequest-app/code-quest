import type { ClientMessage, ContentBlock } from '@code-quest/schemas';
import type { z } from 'zod';
import { asString } from '../../utils.ts';
import type { userSchema } from '../schemas.ts';
import { buildMessagePayload } from './helpers.ts';

type UserMessage = z.infer<typeof userSchema>;

export function transformUser(raw: UserMessage): ClientMessage | null {
  const parentToolUseId = raw.parent_tool_use_id ?? undefined;
  const message = raw.message;
  const rawContent = message?.content;

  // CLI echoes slash-command results as a plain string (e.g. <local-command-stdout>…</local-command-stdout>).
  // These are internal CLI notifications — skip them entirely so they don't appear as conversation messages.
  if (typeof rawContent === 'string') return null;

  const content: Array<Record<string, unknown>> = rawContent ?? [];

  if (!Array.isArray(content)) return null;

  const blocks: ContentBlock[] = [];
  for (const b of content) {
    switch (b.type) {
      case 'text':
        blocks.push({ type: 'text', text: asString(b.text, '') });
        break;
      case 'tool_result':
        blocks.push({
          type: 'tool_result',
          toolUseId: asString(b.tool_use_id, ''),
          toolName: asString(b.name, undefined),
          content: b.content,
          isError: b.is_error ? true : undefined,
        });
        break;
    }
  }

  const uuid = typeof raw.uuid === 'string' ? raw.uuid : undefined;
  const history = raw.isSynthetic !== true && !parentToolUseId;
  const renderAs = raw.isSynthetic === true || parentToolUseId ? 'markdown' : 'plain';
  return {
    name: 'message:user',
    payload: { ...buildMessagePayload(blocks, parentToolUseId, uuid), history, renderAs },
  };
}
