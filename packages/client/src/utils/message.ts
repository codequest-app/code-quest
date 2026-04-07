import {
  type ChatStats,
  type ContentBlock,
  contentBlockSchema,
  type SessionStats,
  sessionStatsSchema,
} from '@code-quest/shared';
import { z } from 'zod';
import type { ChannelState } from '../types/chat';
import type { Message } from '../types/ui';

/** Map server session stats shape to client ChatStats. */
export function mapSessionStats(s: SessionStats): ChatStats {
  return {
    costUsd: s.totalCostUsd,
    durationMs: s.durationMs,
    inputTokens: s.inputTokens,
    outputTokens: s.outputTokens,
    numTurns: s.numTurns,
    modelUsage: s.modelUsage,
  };
}

const historyAssistantSchema = z.object({
  content: z.array(contentBlockSchema),
  parentToolUseId: z.string().optional(),
});

const historyUserSchema = z.object({
  content: z.array(contentBlockSchema),
  parentToolUseId: z.string().optional(),
});

const historyResultSchema = z.object({
  stats: sessionStatsSchema,
});

export const msg = <T extends Message['type']>(
  fields: Omit<Extract<Message, { type: T }>, 'id' | 'timestamp'>,
): Extract<Message, { type: T }> =>
  ({
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    ...fields,
  }) as Extract<Message, { type: T }>;

/** Append a message to channel state. */
export function addMessage(state: ChannelState, fields: Parameters<typeof msg>[0]): ChannelState {
  return { ...state, messages: [...state.messages, msg(fields)] };
}

/**
 * Patch a message's meta without losing the discriminated union type.
 * Cast required: TypeScript cannot verify that spreading a discriminated union
 * member preserves the union — the result type widens to an intersection.
 */
export function patchMeta(m: Message, patch: Record<string, unknown>): Message {
  return { ...m, meta: { ...m.meta, ...patch } } as Message;
}

interface ClientMessage {
  name: string;
  payload: Record<string, unknown>;
}

function messagesFromAssistantBlock(block: ContentBlock, parentToolUseId?: string): Message | null {
  switch (block.type) {
    case 'text':
      return msg({ role: 'assistant', type: 'text', content: block.text, parentToolUseId });
    case 'thinking':
      return msg({ role: 'assistant', type: 'thinking', content: block.thinking });
    case 'tool_use':
      return msg({
        role: 'assistant',
        type: 'tool_use',
        content: block.toolName,
        meta: { toolId: block.toolId, input: block.input },
        parentToolUseId,
      });
    default:
      return null;
  }
}

function messagesFromUserBlock(block: ContentBlock, parentToolUseId?: string): Message | null {
  switch (block.type) {
    case 'tool_result': {
      const rawContent = block.content;
      let textContent = '';
      let arrayContent: unknown[] | undefined;
      if (typeof rawContent === 'string') {
        textContent = rawContent;
      } else if (Array.isArray(rawContent)) {
        arrayContent = rawContent;
        textContent = rawContent
          .filter((b: Record<string, unknown>) => b.type === 'text')
          .map((b: Record<string, unknown>) => String(b.text ?? ''))
          .join('\n');
      }
      return msg({
        role: 'assistant',
        type: 'tool_result',
        content: textContent,
        meta: {
          toolId: block.toolUseId,
          name: block.toolName,
          is_error: block.isError,
          arrayContent,
        },
        parentToolUseId,
      });
    }
    case 'text':
      return msg({ role: 'user', type: 'text', content: block.text });
    default:
      return null;
  }
}

export function buildMessagesFromHistory(events: ClientMessage[]): Message[] {
  const messages: Message[] = [];
  for (const event of events) {
    if (event.name === 'message:assistant') {
      const parsed = historyAssistantSchema.safeParse(event.payload);
      if (!parsed.success) continue;
      for (const block of parsed.data.content) {
        const m = messagesFromAssistantBlock(block, parsed.data.parentToolUseId);
        if (m) messages.push(m);
      }
    } else if (event.name === 'message:user') {
      const parsed = historyUserSchema.safeParse(event.payload);
      if (!parsed.success) continue;
      for (const block of parsed.data.content) {
        const m = messagesFromUserBlock(block, parsed.data.parentToolUseId);
        if (m) messages.push(m);
      }
    } else if (event.name === 'message:result') {
      const parsed = historyResultSchema.safeParse(event.payload);
      if (!parsed.success) continue;
      const stats = mapSessionStats(parsed.data.stats);
      messages.push(msg({ role: 'system', type: 'result', content: '', meta: { stats } }));
    }
  }
  return messages;
}
