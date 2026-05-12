import type { ChannelState } from '@/types/chat';
import { addMessage, mapSessionStats, msg } from '@/utils/message';
import type { Payload } from './guard.ts';

// ── On handlers ──

function onCompactBoundary(
  state: ChannelState,
  _p: Payload<'system:compact_boundary'>,
): ChannelState {
  return {
    ...addMessage(state, {
      role: 'system',
      type: 'compact_boundary',
      content: 'Context was compressed',
    }),
    isContextCompressed: true,
  };
}

function onApiRetry(state: ChannelState, p: Payload<'system:api_retry'>): ChannelState {
  return { ...state, statusText: `Retrying... (${p.attempt}/${p.maxRetries})` };
}

function onRateLimit(state: ChannelState, p: Payload<'system:rate_limit'>): ChannelState {
  return addMessage(state, {
    role: 'system',
    type: 'rate_limit_event',
    content: `Rate limit: ${p.info.status}`,
    rateLimitInfo: p.info,
  });
}

function finalizeThinking(
  messages: ChannelState['messages'],
  durationMs: number | undefined,
): ChannelState['messages'] {
  return messages.map((m) => {
    if (m.type === 'thinking' && m.isStreaming) {
      return { ...m, isStreaming: false, durationMs };
    }
    if (m.type === 'assistant_turn') {
      if (!m.blocks.some((b) => b.type === 'thinking' && b.isStreaming)) return m;
      return {
        ...m,
        blocks: m.blocks.map((b) =>
          b.type === 'thinking' && b.isStreaming ? { ...b, isStreaming: false, durationMs } : b,
        ),
      };
    }
    return m;
  });
}

function onResult(state: ChannelState, p: Payload<'message:result'>): ChannelState {
  const stats = mapSessionStats(p.stats);
  const finalized = finalizeThinking(state.messages, stats.durationMs);
  const messages = p.isError
    ? finalized
    : [...finalized, msg({ role: 'system', type: 'result', content: '', stats })];
  return {
    ...state,
    status: 'idle' as const,
    stats,
    isContextCompressed: false,
    statusText: null,
    messages,
  };
}

function removeAssistantText(
  messages: ChannelState['messages'],
  text: string,
): ChannelState['messages'] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role === 'assistant' && m.type === 'text' && m.content === text) {
      return [...messages.slice(0, i), ...messages.slice(i + 1)];
    }
    if (m?.type === 'assistant_turn') {
      const textBlock = m.blocks.find((b) => b.type === 'text' && b.content === text);
      if (!textBlock) continue;
      const filtered = m.blocks.filter((b) => b !== textBlock);
      if (filtered.length === 0) return [...messages.slice(0, i), ...messages.slice(i + 1)];
      const next = [...messages];
      next[i] = { ...m, blocks: filtered };
      return next;
    }
  }
  return messages;
}

function onErrorMessage(state: ChannelState, p: Payload<'error:message'>): ChannelState {
  return addMessage(
    { ...state, messages: removeAssistantText(state.messages, p.message) },
    {
      role: 'system',
      type: 'error',
      content: p.kind ?? p.message,
      ...(p.kind ? { detail: p.message } : {}),
    },
  );
}

function onPostTurnSummary(
  state: ChannelState,
  p: Payload<'system:post_turn_summary'>,
): ChannelState {
  return addMessage(state, { role: 'system', type: 'post_turn_summary', content: p.summary });
}

// ── Handler map ──

export const systemHandlerOn: {
  'system:compact_boundary': typeof onCompactBoundary;
  'system:api_retry': typeof onApiRetry;
  'system:rate_limit': typeof onRateLimit;
  'system:post_turn_summary': typeof onPostTurnSummary;
  'error:message': typeof onErrorMessage;
  'message:result': typeof onResult;
} = {
  'system:compact_boundary': onCompactBoundary,
  'system:api_retry': onApiRetry,
  'system:rate_limit': onRateLimit,
  'system:post_turn_summary': onPostTurnSummary,
  'error:message': onErrorMessage,
  'message:result': onResult,
} satisfies Record<string, (state: ChannelState, payload: never) => ChannelState>;
