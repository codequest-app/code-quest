import { type ContentBlock, EVENTS } from '@code-quest/shared';
import type { RefObject } from 'react';
import type { TypedSocket } from '@/socket/client';
import { channelEmit } from '@/socket/rpc';
import type { ChannelState } from '@/types/chat';
import { addMessage, msg } from '@/utils/message';
import type { Payload } from './guard.ts';

const MAX_QUEUED_MESSAGES = 10;

type TextChunk = { type?: string; text?: string };
function isTextChunk(b: unknown): b is TextChunk {
  return typeof b === 'object' && b !== null;
}

// ── Helpers ──

type Message = ChannelState['messages'][number];

function deduplicateUserMessage(
  messages: Message[],
  uuid: string,
  text: string,
): { messages: Message[]; matched: boolean } {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m) continue;
    if (m.cliUuid === uuid) return { messages, matched: true };
    if (m.role === 'user' && m.type === 'text' && m.content === text && !m.cliUuid) {
      const next = [...messages];
      next[i] = { ...m, cliUuid: uuid } as Message;
      return { messages: next, matched: true };
    }
  }
  return { messages, matched: false };
}

function extractToolResultText(rawContent: unknown): string {
  if (Array.isArray(rawContent)) {
    return rawContent
      .filter(isTextChunk)
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('\n');
  }
  return String(rawContent ?? '');
}

function applyUserContent(
  state: ChannelState,
  content: ContentBlock[],
  uuid?: string,
  history?: boolean,
  renderAs?: 'markdown' | 'plain',
): ChannelState {
  let messages = [...state.messages];
  let historyMessages = [...state.historyMessages];
  for (const block of content) {
    if (block.type === 'text') {
      // Search from the end for the most recent matching local user msg.
      // Streaming events (assistant placeholder, etc.) often land between
      // sendMessage and the CLI's user-replay echo, so the matching msg is
      // not always last. Scan back to find it.
      if (uuid) {
        const result = deduplicateUserMessage(messages, uuid, block.text);
        messages = result.messages;
        if (result.matched) continue;
      }
      const isInterrupt = block.text?.startsWith('[Request interrupted');
      const m = isInterrupt
        ? msg({ role: 'user', type: 'interrupt', content: block.text })
        : msg({
            role: 'user',
            type: 'text',
            content: block.text,
            meta: {
              ...(history !== undefined ? { history } : {}),
              ...(renderAs !== undefined ? { renderAs } : {}),
            },
          });
      const entry = uuid ? { ...m, cliUuid: uuid } : m;
      messages = [...messages, entry];
      if (!isInterrupt) {
        const trimmed = block.text?.trim();
        if (history === true && trimmed) {
          historyMessages = [...historyMessages, trimmed];
        }
      }
    } else if (block.type === 'tool_result') {
      const textContent = extractToolResultText(block.content);
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
  return { ...state, messages, historyMessages };
}

// ── On handlers ──

function applyAssistantBlock(
  state: ChannelState,
  block: ContentBlock,
  parentToolUseId?: string,
): ChannelState {
  switch (block.type) {
    case 'text':
      return addMessage(state, {
        role: 'assistant',
        type: 'text',
        content: block.text,
        parentToolUseId,
      });
    case 'thinking':
      return addMessage(state, {
        role: 'assistant',
        type: 'thinking',
        content: block.thinking,
        parentToolUseId,
      });
    case 'tool_use':
      return addMessage(state, {
        role: 'assistant',
        type: 'tool_use',
        content: block.toolName,
        meta: {
          toolId: block.toolId,
          input: block.input as Record<string, unknown>,
          ...(block.model ? { model: block.model } : {}),
        },
        parentToolUseId,
      });
    default:
      return state;
  }
}

export function onMessageAssistant(
  state: ChannelState,
  p: Payload<'message:assistant'>,
  skipText = false,
  skipThinking = false,
): ChannelState {
  return p.content.reduce((s, block) => {
    if (block.type === 'text' && skipText) return s;
    if (block.type === 'thinking' && skipThinking) return s;
    return applyAssistantBlock(s, block, p.parentToolUseId);
  }, state);
}

function onMessageUser(state: ChannelState, p: Payload<'message:user'>): ChannelState {
  return applyUserContent(state, p.content, p.uuid, p.history, p.renderAs);
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

export const messageHandlerOn: {
  'message:user': typeof onMessageUser;
  'stream:text': typeof onStreamText;
  'stream:tool_summary': typeof onStreamToolSummary;
} = {
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
}: MessageActionsDeps): {
  sendMessage: (message: string) => void;
  abort: () => void;
  kill: () => void;
  appendMessage: (fields: Parameters<typeof msg>[0]) => void;
} {
  function sendMessage(message: string): void {
    if (statusRef.current === 'processing') {
      if (messageQueueRef.current.length < MAX_QUEUED_MESSAGES)
        messageQueueRef.current.push(message);
    } else {
      channelEmit(socket, channelId, 'chat:send', { message });
    }
    setChannelState((s) => ({
      ...addMessage(s, {
        role: 'user',
        type: 'text',
        content: message,
        meta: { history: true, renderAs: 'plain' as const },
      }),
      ...(s.status !== 'processing' ? { status: 'processing' as const } : {}),
    }));
  }

  function abort(): void {
    channelEmit(socket, channelId, EVENTS.chat.cancel, {});
    setChannelState((prev) => ({ ...prev, status: 'cancelling' as const }));
  }

  function kill(): void {
    channelEmit(socket, channelId, EVENTS.session.close, {});
  }

  function appendMessage(fields: Parameters<typeof msg>[0]): void {
    setChannelState((s) => addMessage(s, fields));
  }

  return { sendMessage, abort, kill, appendMessage };
}
