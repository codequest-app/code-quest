import type { ContentBlock } from '@code-quest/shared';
import { EVENTS } from '@code-quest/shared';
import type { RefObject } from 'react';
import type { TypedSocket } from '@/socket/client';
import { channelEmit } from '@/socket/rpc';
import type { ChannelState } from '@/types/chat';
import { addMessage, msg } from '@/utils/message';
import type { Payload } from './guard.ts';

const MAX_QUEUED_MESSAGES = 10;

type TextChunk = { type: string; text?: string };
function isTextChunk(b: unknown): b is TextChunk {
  return typeof b === 'object' && b !== null && 'type' in (b as object);
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

function processTextBlock(
  block: ContentBlock & { type: 'text' },
  messages: Message[],
  historyMessages: string[],
  uuid?: string,
  history?: boolean,
  renderAs?: 'markdown' | 'plain',
  parentToolUseId?: string,
): { messages: Message[]; historyMessages: string[] } {
  // Search from the end for the most recent matching local user msg.
  // Streaming events (assistant placeholder, etc.) often land between
  // sendMessage and the CLI's user-replay echo, so the matching msg is
  // not always last. Scan back to find it.
  if (uuid) {
    const result = deduplicateUserMessage(messages, uuid, block.text);
    if (result.matched) return { messages: result.messages, historyMessages };
    messages = result.messages;
  }
  const isInterrupt = block.text?.startsWith('[Request interrupted');
  const m = isInterrupt
    ? msg({ role: 'user', type: 'interrupt', content: block.text })
    : msg({
        role: 'user',
        type: 'text',
        content: block.text,
        ...(history !== undefined ? { history } : {}),
        ...(renderAs !== undefined ? { renderAs } : {}),
        ...(parentToolUseId !== undefined ? { parentToolUseId } : {}),
      });
  const entry = uuid ? { ...m, cliUuid: uuid } : m;
  messages = [...messages, entry];
  if (!isInterrupt) {
    const trimmed = block.text?.trim();
    if (history === true && trimmed) {
      historyMessages = [...historyMessages, trimmed];
    }
  }
  return { messages, historyMessages };
}

function updateTaskStatus(
  tasks: ChannelState['tasks'],
  toolUseId: string,
  isError: boolean | undefined,
): ChannelState['tasks'] {
  const existingTask = tasks.get(toolUseId);
  if (existingTask?.status !== 'running') return tasks;
  const next = new Map(tasks);
  next.set(toolUseId, { ...existingTask, status: isError ? 'failed' : 'completed' });
  return next;
}

function processToolResultBlock(
  block: ContentBlock & { type: 'tool_result' },
  messages: Message[],
  results: ChannelState['results'],
  tasks: ChannelState['tasks'],
): { messages: Message[]; results: ChannelState['results']; tasks: ChannelState['tasks'] } {
  const textContent = extractToolResultText(block.content);
  messages = [
    ...messages,
    msg({
      role: 'assistant',
      type: 'tool_result',
      content: textContent,
      toolId: block.toolUseId,
      name: block.toolName,
      is_error: block.isError,
      contentBlocks: Array.isArray(block.content) ? block.content : undefined,
    }),
  ];
  results = new Map(results);
  results.set(block.toolUseId, { content: textContent, is_error: block.isError });
  tasks = updateTaskStatus(tasks, block.toolUseId, block.isError);
  return { messages, results, tasks };
}

function applyContentBlocks(
  state: ChannelState,
  content: ContentBlock[],
  uuid?: string,
  history?: boolean,
  renderAs?: 'markdown' | 'plain',
  parentToolUseId?: string,
): ChannelState {
  let messages = [...state.messages];
  let historyMessages = [...state.historyMessages];
  let tasks = state.tasks;
  let results = state.results;
  for (const block of content) {
    if (block.type === 'text') {
      ({ messages, historyMessages } = processTextBlock(
        block,
        messages,
        historyMessages,
        uuid,
        history,
        renderAs,
        parentToolUseId,
      ));
    } else if (block.type === 'tool_result') {
      ({ messages, results, tasks } = processToolResultBlock(block, messages, results, tasks));
    }
  }
  return { ...state, messages, historyMessages, tasks, results };
}

// ── On handlers ──

function onMessageUser(state: ChannelState, p: Payload<'message:user'>): ChannelState {
  return applyContentBlocks(state, p.content, p.uuid, p.history, p.renderAs, p.parentToolUseId);
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
        history: true,
        renderAs: 'plain' as const,
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
