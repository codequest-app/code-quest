import type { ContentBlock } from '@code-quest/shared';
import type { RefObject } from 'react';
import type { TypedSocket } from '@/socket/client';
import { channelEmit } from '@/socket/rpc';
import type { ChannelState } from '@/types/chat';
import { addMessage, msg } from '@/utils/message';
import type { Payload } from './guard';

type TextChunk = { type?: string; text?: string };
function isTextChunk(b: unknown): b is TextChunk {
  return typeof b === 'object' && b !== null;
}

// ── Helpers ──

function applyUserContent(
  state: ChannelState,
  content: ContentBlock[],
  uuid?: string,
  source?: 'typed' | 'skill' | 'command' | 'reminder',
): ChannelState {
  let messages = [...state.messages];
  const resolvedSource = source ?? 'typed';
  for (const block of content) {
    if (block.type === 'text') {
      // Search from the end for the most recent matching local user msg.
      // Streaming events (assistant placeholder, etc.) often land between
      // sendMessage and the CLI's user-replay echo, so the matching msg is
      // not always last. Scan back to find it.
      let matched = false;
      if (uuid) {
        for (let i = messages.length - 1; i >= 0; i--) {
          const m = messages[i];
          if (m.cliUuid === uuid) {
            // Same uuid already attached — idempotent no-op.
            matched = true;
            break;
          }
          if (m.role === 'user' && m.type === 'text' && m.content === block.text && !m.cliUuid) {
            messages = [...messages];
            messages[i] = { ...m, cliUuid: uuid, meta: { ...m.meta, source: resolvedSource } };
            matched = true;
            break;
          }
        }
      }
      if (matched) continue;
      const m = msg({
        role: 'user',
        type: 'text',
        content: block.text,
        meta: { source: resolvedSource },
      });
      messages = [...messages, uuid ? { ...m, cliUuid: uuid } : m];
    } else if (block.type === 'tool_result') {
      const rawContent = block.content;
      const textContent = Array.isArray(rawContent)
        ? rawContent
            .filter(isTextChunk)
            .filter((b) => b.type === 'text')
            .map((b) => b.text ?? '')
            .join('\n')
        : String(rawContent ?? '');
      messages = [
        ...messages,
        msg({
          role: 'assistant',
          type: 'tool_result',
          content: textContent,
          meta: { toolId: block.toolUseId, name: block.toolName, is_error: block.isError },
        }),
      ];
    }
  }
  return { ...state, messages };
}

// ── On handlers ──

function onMessageUser(state: ChannelState, p: Payload<'message:user'>): ChannelState {
  return applyUserContent(state, p.content, p.uuid, p.source);
}

function onStreamText(state: ChannelState, p: Payload<'stream:text'>): ChannelState {
  return addMessage(state, { role: 'assistant', type: 'streamlined_text', content: p.text });
}

function onStreamToolSummary(state: ChannelState, p: Payload<'stream:tool_summary'>): ChannelState {
  return addMessage(state, {
    role: 'assistant',
    type: 'streamlined_tool_use_summary',
    content: p.toolSummary,
  });
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
  function sendMessage(message: string) {
    if (statusRef.current === 'processing') {
      if (messageQueueRef.current.length < 10) messageQueueRef.current.push(message);
    } else {
      channelEmit(socket, channelId, 'chat:send', { message });
    }
    setChannelState((s) => ({
      ...s,
      messages: [...s.messages, msg({ role: 'user', type: 'text', content: message })],
      ...(s.status !== 'processing' ? { status: 'processing' as const } : {}),
    }));
  }

  function abort() {
    channelEmit(socket, channelId, 'chat:cancel', {});
    setChannelState((prev) => ({ ...prev, status: 'cancelling' as const }));
  }

  function kill() {
    channelEmit(socket, channelId, 'session:close', {});
  }

  return { sendMessage, abort, kill };
}
