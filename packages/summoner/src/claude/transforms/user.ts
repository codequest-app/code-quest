import type { ContentBlock } from '@code-quest/shared';
import type { z } from 'zod';
import type { ClientMessage } from '../../types.ts';
import type { userSchema } from '../schemas.ts';
import { buildMessagePayload } from './helpers.ts';

type UserMessage = z.infer<typeof userSchema>;

export type UserSource = 'typed' | 'skill' | 'command' | 'reminder';

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
        blocks.push({ type: 'text', text: String(b.text ?? '') });
        break;
      case 'tool_result':
        blocks.push({
          type: 'tool_result',
          toolUseId: String(b.tool_use_id ?? ''),
          toolName: typeof b.name === 'string' ? b.name : undefined,
          content: b.content,
          isError: b.is_error === true ? true : undefined,
        });
        break;
    }
  }

  const uuid = typeof raw.uuid === 'string' ? raw.uuid : undefined;
  const source: UserSource = raw.isSynthetic === true ? 'skill' : 'typed';
  return {
    name: 'message:user',
    payload: { ...buildMessagePayload(blocks, parentToolUseId, uuid), source },
  };
}
