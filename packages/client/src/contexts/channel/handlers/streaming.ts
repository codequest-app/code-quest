import type { ChannelState } from '@/types/chat';
import type { TextMeta } from '@/types/ui';
import { msg, patchMeta } from '@/utils/message';
import type { Payload } from './guard.ts';
import { onMessageAssistant } from './message.ts';

type Message = ChannelState['messages'][number];

// ── Helpers ──

function removePlaceholder(state: ChannelState): ChannelState {
  if (
    state.messages.length > 0 &&
    state.messages[state.messages.length - 1]?.type === 'content_block_start'
  ) {
    return { ...state, messages: state.messages.slice(0, -1) };
  }
  return state;
}

function appendToLast(state: ChannelState, content: string): ChannelState {
  const last = state.messages[state.messages.length - 1];
  if (!last) return state;
  const messages = [...state.messages.slice(0, -1), { ...last, content: last.content + content }];
  return { ...state, messages };
}

// ── Chunk handlers ──

function onTextChunk(state: ChannelState, content: string, parentToolUseId?: string): ChannelState {
  const s = removePlaceholder(state);
  if (s.isTextStreaming) {
    return { ...appendToLast(s, content), wasStreamedViaDelta: true, isThinkingStreaming: false };
  }
  return {
    ...s,
    messages: [...s.messages, msg({ role: 'assistant', type: 'text', content, parentToolUseId })],
    isTextStreaming: true,
    isThinkingStreaming: false,
    wasStreamedViaDelta: true,
  };
}

function onThinkingChunk(
  state: ChannelState,
  content: string,
  parentToolUseId?: string,
): ChannelState {
  const s = removePlaceholder(state);
  if (s.isThinkingStreaming) {
    return appendToLast(s, content);
  }
  return {
    ...s,
    messages: [
      ...s.messages,
      msg({
        role: 'assistant',
        type: 'thinking',
        content,
        parentToolUseId,
        meta: { isStreaming: true },
      }),
    ],
    isThinkingStreaming: true,
    isTextStreaming: false,
    wasStreamedViaDelta: false,
  };
}

function onInputJsonChunk(state: ChannelState, content: string): ChannelState {
  let lastToolUse: Extract<Message, { type: 'tool_use' }> | undefined;
  for (let i = state.messages.length - 1; i >= 0; i--) {
    const m = state.messages[i];
    if (m?.type === 'tool_use') {
      lastToolUse = m as Extract<Message, { type: 'tool_use' }>;
      break;
    }
  }
  if (!lastToolUse) return state;
  const partial = lastToolUse.meta?.partialInput ?? '';
  return {
    ...state,
    messages: state.messages.map((m) =>
      m.id === lastToolUse.id ? patchMeta(m, { partialInput: partial + content }) : m,
    ),
  };
}

function onCitationsChunk(state: ChannelState, citations: unknown[] | undefined): ChannelState {
  if (!citations?.length) return state;
  const last = state.messages[state.messages.length - 1];
  if (!last) return state;
  const textMeta = last.type === 'text' ? (last.meta as TextMeta | undefined) : undefined;
  const existing = textMeta?.citations ?? [];
  return {
    ...state,
    messages: [
      ...state.messages.slice(0, -1),
      patchMeta(last, { citations: [...existing, ...citations] }),
    ],
  };
}

// ── On handlers ──

export const resetStreaming = {
  isTextStreaming: false,
  isThinkingStreaming: false,
  wasStreamedViaDelta: false,
};

function onStreamChunk(state: ChannelState, p: Payload<'stream:chunk'>): ChannelState {
  const { chunk, parentToolUseId } = p;
  switch (chunk.kind) {
    case 'text':
      return onTextChunk(state, chunk.content, parentToolUseId);
    case 'thinking':
      return onThinkingChunk(state, chunk.content, parentToolUseId);
    case 'input_json':
      return onInputJsonChunk(state, chunk.content);
    case 'citations':
      return onCitationsChunk(state, chunk.citations);
    default:
      return state;
  }
}

function onStreamEnd(state: ChannelState, _p: Payload<'stream:end'>): ChannelState {
  return { ...state, ...resetStreaming };
}

function onMessageAssistantHandler(
  state: ChannelState,
  p: Payload<'message:assistant'>,
): ChannelState {
  const next = onMessageAssistant(state, p, state.wasStreamedViaDelta, state.isThinkingStreaming);
  return { ...next, ...resetStreaming };
}

export const streamingHandlerOn: {
  'stream:chunk': typeof onStreamChunk;
  'stream:end': typeof onStreamEnd;
  'message:assistant': typeof onMessageAssistantHandler;
} = {
  'stream:chunk': onStreamChunk,
  'stream:end': onStreamEnd,
  'message:assistant': onMessageAssistantHandler,
} satisfies Record<string, (state: ChannelState, payload: never) => ChannelState>;
