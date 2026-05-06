import type { ChatStats, SessionStats } from '@code-quest/shared';
import type { ChannelState } from '../types/chat.ts';
import type { Message } from '../types/ui.ts';

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

export const msg = <T extends Message['type']>(
  fields: Omit<Extract<Message, { type: T }>, 'id' | 'timestamp'>,
): Extract<Message, { type: T }> =>
  ({
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    ...fields,
  }) as Extract<Message, { type: T }>;

/** Escape hatch for runtime-supplied `type` strings not in the Message union
 *  (e.g., forward-compat CLI events). UI has a fallback renderer. */
export function systemMessage(type: string, content: string): Message {
  return msg({ role: 'system', type: type as Message['type'], content });
}

/** Append a message to channel state. */
export function addMessage(state: ChannelState, fields: Parameters<typeof msg>[0]): ChannelState {
  const m = msg(fields);
  const trimmed = m.content.trim();
  const isHistory = trimmed && (m.meta as { history?: boolean } | undefined)?.history === true;
  return {
    ...state,
    messages: [...state.messages, m],
    historyMessages: isHistory ? [...state.historyMessages, trimmed] : state.historyMessages,
  };
}

/**
 * Patch a message's meta without losing the discriminated union type.
 * Cast required: TypeScript cannot verify that spreading a discriminated union
 * member preserves the union — the result type widens to an intersection.
 */
export function patchMeta(m: Message, patch: Record<string, unknown>): Message {
  return { ...m, meta: { ...m.meta, ...patch } } as Message;
}
