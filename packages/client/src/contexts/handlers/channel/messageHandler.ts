import type { ContentBlock, ServerToClientEvents } from '@code-quest/shared';
import type { RefObject } from 'react';
import type { TypedSocket } from '../../../socket/client';
import { channelEmit } from '../../../socket/rpc';
import type { ChannelState } from '../../../types/chat';
import { msg } from '../../../utils/message';

type Payload<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

// ── Helpers ──

function addMessage(state: ChannelState, fields: Parameters<typeof msg>[0]): ChannelState {
  return { ...state, messages: [...state.messages, msg(fields)] };
}

function applyUserContent(state: ChannelState, content: ContentBlock[]): ChannelState {
  let messages = [...state.messages];
  for (const block of content) {
    if (block.type === 'text') {
      const last = messages[messages.length - 1];
      if (last?.role === 'user' && last?.type === 'text' && last?.content === block.text) {
        continue;
      }
      messages = [...messages, msg({ role: 'user', type: 'text', content: block.text })];
    } else if (block.type === 'tool_result') {
      messages = [
        ...messages,
        msg({
          role: 'assistant',
          type: 'tool_result',
          content: String(block.content ?? ''),
          meta: { toolId: block.toolUseId, name: block.toolName },
        }),
      ];
    }
  }
  return { ...state, messages };
}

// ── On handlers ──

function onMessageUser(state: ChannelState, p: Payload<'message:user'>): ChannelState {
  return applyUserContent(state, p.content);
}

function onStreamText(state: ChannelState, p: Payload<'stream:text'>): ChannelState {
  return addMessage(state, { role: 'assistant', type: 'streamlined_text', content: p.text });
}

function onStreamToolSummary(state: ChannelState, p: Payload<'stream:tool_summary'>): ChannelState {
  return addMessage(state, { role: 'assistant', type: 'streamlined_tool_use_summary', content: p.toolSummary });
}

// ── Handler map ──

export const messageHandlerOn = {
  'message:user': onMessageUser,
  'stream:text': onStreamText,
  'stream:tool_summary': onStreamToolSummary,
} satisfies Record<string, (state: ChannelState, payload: never) => ChannelState>;

// ── Actions (emit) ──

interface MessageActionsDeps {
  socket: TypedSocket;
  channelId: string;
  setChannelState: (fn: (prev: ChannelState) => ChannelState) => void;
  statusRef: RefObject<string>;
  messageQueueRef: RefObject<string[]>;
}

export function createMessageActions({
  socket,
  channelId,
  setChannelState,
  statusRef,
  messageQueueRef,
}: MessageActionsDeps) {
  const emit = (event: string, payload: Record<string, unknown>, ...rest: unknown[]) =>
    channelEmit(socket, channelId, event, payload, ...rest);

  function sendMessage(message: string) {
    if (statusRef.current === 'processing') {
      if (messageQueueRef.current.length < 10) messageQueueRef.current.push(message);
    } else {
      emit('chat:send', { message });
    }
    setChannelState((s) => ({
      ...s,
      messages: [...s.messages, msg({ role: 'user', type: 'text', content: message })],
      ...(s.status !== 'processing' ? { status: 'processing' as const } : {}),
    }));
  }

  function abort() {
    emit('chat:cancel', {});
    setChannelState((prev) => ({ ...prev, status: 'cancelling' as const }));
  }

  function kill() {
    emit('session:close', {});
  }

  return { sendMessage, abort, kill };
}
