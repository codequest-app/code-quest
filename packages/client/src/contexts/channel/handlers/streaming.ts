import { type ContentBlock, EVENTS, fsReadResponseSchema, isRecord } from '@code-quest/shared';
import type { RefObject } from 'react';
import type { TypedSocket } from '@/socket/client';
import type { ChannelState } from '@/types/chat';
import { msg, patchMeta, updateLastMessage } from '@/utils/message';
import type { Payload } from './guard.ts';

type SetChannelState = (fn: (prev: ChannelState) => ChannelState) => void;
type Message = ChannelState['messages'][number];

// ── Streaming helpers ──

function removePlaceholder(setState: SetChannelState): void {
  setState((prev) => {
    if (
      prev.messages.length > 0 &&
      prev.messages[prev.messages.length - 1]?.type === 'content_block_start'
    ) {
      return { ...prev, messages: prev.messages.slice(0, -1) };
    }
    return prev;
  });
}

function appendToLast(setState: SetChannelState, content: string): void {
  updateLastMessage(setState, (last) => ({ ...last, content: last.content + content }));
}

function appendOrCreate(
  setState: SetChannelState,
  isTextStreaming: RefObject<boolean>,
  content: string,
  parentToolUseId?: string,
): void {
  removePlaceholder(setState);
  if (isTextStreaming.current) {
    appendToLast(setState, content);
  } else {
    isTextStreaming.current = true;
    setState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        msg({ role: 'assistant', type: 'text', content, parentToolUseId }),
      ],
    }));
  }
}

// ── Deps ──

interface StreamingHandlerDeps {
  socket: TypedSocket;
  channelId: string;
  setState: SetChannelState;
  isTextStreaming: RefObject<boolean>;
  isThinkingStreaming: RefObject<boolean>;
  wasStreamedViaDelta: RefObject<boolean>;
  resetStreamingRefs: () => void;
}

// ── Wire ──

export function wireStreamingHandlers({
  socket,
  channelId,
  setState,
  isTextStreaming,
  isThinkingStreaming,
  wasStreamedViaDelta,
  resetStreamingRefs,
}: StreamingHandlerDeps): () => void {
  function guard<P extends { channelId: string }>(p: P): boolean {
    return p.channelId === channelId;
  }

  // ── Chunk handlers ──

  function handleTextChunk(content: string, parentToolUseId?: string) {
    isThinkingStreaming.current = false;
    wasStreamedViaDelta.current = true;
    appendOrCreate(setState, isTextStreaming, content, parentToolUseId);
  }

  function handleThinkingChunk(content: string, parentToolUseId?: string) {
    removePlaceholder(setState);
    if (isThinkingStreaming.current) {
      appendToLast(setState, content);
      return;
    }
    isThinkingStreaming.current = true;
    isTextStreaming.current = false;
    wasStreamedViaDelta.current = false;
    setState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        msg({
          role: 'assistant',
          type: 'thinking',
          content,
          parentToolUseId,
          meta: { isStreaming: true },
        }),
      ],
    }));
  }

  function handleInputJsonChunk(content: string) {
    setState((prev) => {
      const lastToolUse = [...prev.messages]
        .reverse()
        .find((m): m is Extract<Message, { type: 'tool_use' }> => m.type === 'tool_use');
      if (!lastToolUse) return prev;
      const partial = lastToolUse.meta?.partialInput ?? '';
      return {
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === lastToolUse.id ? patchMeta(m, { partialInput: partial + content }) : m,
        ),
      };
    });
  }

  function handleCitationsChunk(citations: unknown[] | undefined) {
    if (!citations?.length) return;
    updateLastMessage(setState, (last) => {
      // TextMeta is the only meta shape with citations (text content blocks).
      const textMeta = last.type === 'text' ? last.meta : undefined;
      const existing = textMeta?.citations ?? [];
      return patchMeta(last, { citations: [...existing, ...citations] });
    });
  }

  function onStreamChunk(p: Payload<'stream:chunk'>) {
    if (!guard(p)) return;
    const { chunk, parentToolUseId } = p;
    switch (chunk.kind) {
      case 'text':
        return handleTextChunk(chunk.content, parentToolUseId);
      case 'thinking':
        return handleThinkingChunk(chunk.content, parentToolUseId);
      case 'input_json':
        return handleInputJsonChunk(chunk.content);
      case 'citations':
        return handleCitationsChunk(chunk.citations);
    }
  }

  function onStreamEnd(p: Payload<'stream:end'>) {
    if (!guard(p)) return;
    resetStreamingRefs();
  }

  // ── message:assistant ──

  function fetchFileContentIfNeeded(
    block: { toolName: string; input: unknown },
    toolMsgId: string,
  ) {
    if (block.toolName !== 'open_file' || !block.input) return;
    const inp = block.input;
    const filePath = isRecord(inp) && 'file_path' in inp ? String(inp.file_path) : undefined;
    if (!filePath) return;
    socket.emit(EVENTS.fs.read, { path: filePath }, (raw) => {
      const parsed = fsReadResponseSchema.safeParse(raw);
      if (!parsed.success) return;
      const res = parsed.data;
      setState((prev) => {
        const ms = [...prev.messages];
        const idx = ms.findIndex((m) => m.id === toolMsgId);
        const target = ms[idx];
        if (idx < 0 || !target) return prev;
        ms[idx] = patchMeta(target, {
          fileContent: 'content' in res ? res.content : undefined,
          fileError: 'error' in res ? res.error : undefined,
        });
        return { ...prev, messages: ms };
      });
    });
  }

  function applyTextBlock(
    block: Extract<ContentBlock, { type: 'text' }>,
    parentToolUseId?: string,
  ) {
    isThinkingStreaming.current = false;
    if (!wasStreamedViaDelta.current) {
      appendOrCreate(setState, isTextStreaming, block.text, parentToolUseId);
    }
  }

  function applyThinkingBlock(
    block: Extract<ContentBlock, { type: 'thinking' }>,
    parentToolUseId?: string,
  ) {
    if (isThinkingStreaming.current) return;
    isThinkingStreaming.current = true;
    setState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        msg({
          role: 'assistant',
          type: 'thinking',
          content: block.thinking,
          parentToolUseId,
        }),
      ],
    }));
  }

  function applyToolUseBlock(
    block: Extract<ContentBlock, { type: 'tool_use' }>,
    parentToolUseId?: string,
  ) {
    resetStreamingRefs();
    const toolMsg = msg({
      role: 'assistant',
      type: 'tool_use',
      content: block.toolName,
      meta: {
        toolId: block.toolId,
        input: block.input,
        ...(block.model ? { model: block.model } : {}),
      },
      parentToolUseId,
    });
    setState((prev) => ({ ...prev, messages: [...prev.messages, toolMsg] }));
    fetchFileContentIfNeeded(block, toolMsg.id);
  }

  function handleAssistantContent(content: ContentBlock[], parentToolUseId?: string) {
    for (const block of content) {
      if (block.type === 'text') applyTextBlock(block, parentToolUseId);
      else if (block.type === 'thinking') applyThinkingBlock(block, parentToolUseId);
      else if (block.type === 'tool_use') applyToolUseBlock(block, parentToolUseId);
    }
    resetStreamingRefs();
  }

  function onMessageAssistant(p: Payload<'message:assistant'>) {
    if (!guard(p)) return;
    handleAssistantContent(p.content, p.parentToolUseId);
  }

  socket.on(EVENTS.stream.chunk, onStreamChunk);
  socket.on(EVENTS.stream.end, onStreamEnd);
  socket.on(EVENTS.message.assistant, onMessageAssistant);
  return () => {
    socket.off(EVENTS.stream.chunk, onStreamChunk);
    socket.off(EVENTS.stream.end, onStreamEnd);
    socket.off(EVENTS.message.assistant, onMessageAssistant);
  };
}
