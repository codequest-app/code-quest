import type { ContentBlock } from '@code-quest/shared';
import { fileReadResponseSchema } from '@code-quest/shared';
import type { RefObject } from 'react';
import type { TypedSocket } from '@/socket/client';
import type { ChannelState } from '@/types/chat';
import { isRecord } from '@/utils/is-record';
import { msg, patchMeta } from '@/utils/message';
import type { Payload } from './guard';

type SetChannelState = (fn: (prev: ChannelState) => ChannelState) => void;
type Message = ChannelState['messages'][number];

// ── Streaming helpers ──

function removePlaceholder(setState: SetChannelState): void {
  setState((prev) => {
    if (
      prev.messages.length > 0 &&
      prev.messages[prev.messages.length - 1].type === 'content_block_start'
    ) {
      return { ...prev, messages: prev.messages.slice(0, -1) };
    }
    return prev;
  });
}

function appendToLast(setState: SetChannelState, content: string): void {
  setState((prev) => {
    if (prev.messages.length === 0) return prev;
    const msgs = [...prev.messages];
    msgs[msgs.length - 1] = {
      ...msgs[msgs.length - 1],
      content: msgs[msgs.length - 1].content + content,
    };
    return { ...prev, messages: msgs };
  });
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
      let lastToolUse: Message | undefined;
      for (let i = prev.messages.length - 1; i >= 0; i--) {
        if (prev.messages[i].type === 'tool_use') {
          lastToolUse = prev.messages[i];
          break;
        }
      }
      if (!lastToolUse) return prev;
      const partial =
        typeof lastToolUse.meta?.partialInput === 'string' ? lastToolUse.meta.partialInput : '';
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
    setState((prev) => {
      if (prev.messages.length === 0) return prev;
      const ms = [...prev.messages];
      const last = ms[ms.length - 1];
      const existing = Array.isArray(last.meta?.citations) ? last.meta.citations : [];
      ms[ms.length - 1] = patchMeta(last, { citations: [...existing, ...citations] });
      return { ...prev, messages: ms };
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
    socket.emit('file:read', { channelId, filePath }, (raw) => {
      const parsed = fileReadResponseSchema.safeParse(raw);
      if (!parsed.success) return;
      const res = parsed.data;
      setState((prev) => {
        const ms = [...prev.messages];
        const idx = ms.findIndex((m) => m.id === toolMsgId);
        if (idx < 0) return prev;
        ms[idx] = patchMeta(ms[idx], {
          fileContent: 'content' in res ? res.content : undefined,
          fileError: 'error' in res ? res.error : undefined,
        });
        return { ...prev, messages: ms };
      });
    });
  }

  function handleAssistantContent(content: ContentBlock[], parentToolUseId?: string) {
    for (const block of content) {
      if (block.type === 'text') {
        isThinkingStreaming.current = false;
        if (!wasStreamedViaDelta.current)
          appendOrCreate(setState, isTextStreaming, block.text, parentToolUseId);
      } else if (block.type === 'thinking') {
        if (!isThinkingStreaming.current) {
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
      } else if (block.type === 'tool_use') {
        resetStreamingRefs();
        const toolMsg = msg({
          role: 'assistant',
          type: 'tool_use',
          content: block.toolName,
          meta: { toolId: block.toolId, input: block.input },
          parentToolUseId,
        });
        setState((prev) => ({ ...prev, messages: [...prev.messages, toolMsg] }));
        fetchFileContentIfNeeded(block, toolMsg.id);
      }
    }
    resetStreamingRefs();
  }

  function onMessageAssistant(p: Payload<'message:assistant'>) {
    if (!guard(p)) return;
    handleAssistantContent(p.content, p.parentToolUseId);
  }

  socket.on('stream:chunk', onStreamChunk);
  socket.on('stream:end', onStreamEnd);
  socket.on('message:assistant', onMessageAssistant);
  return () => {
    socket.off('stream:chunk', onStreamChunk);
    socket.off('stream:end', onStreamEnd);
    socket.off('message:assistant', onMessageAssistant);
  };
}
