import type {
  ChatStats,
  ContentBlock,
  FileSearchResult,
  PlanCommentData,
  ServerToClientEvents,
} from '@code-quest/shared';
import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type ChannelInitialState, type ChannelState, initialChannelState } from '../../types/chat';
import { buildMessagesFromHistory, msg } from '../../utils/message';
import { useSocket } from '../SocketContext';
import { type EffectDeps, createMessagesActions, messagesEffects, messagesHandlers } from '../handlers/channel/messagesHandlers';

type SetChannelState = (fn: (prev: ChannelState) => ChannelState) => void;

type Payload<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

// ── Streaming helpers (module-level, pure functions) ──

function streamingRemovePlaceholder(setState: SetChannelState) {
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

function streamingAppendToLast(setState: SetChannelState, content: string) {
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

function streamingAppendOrCreate(
  setState: SetChannelState,
  isTextStreaming: RefObject<boolean>,
  removePlaceholder: () => void,
  content: string,
  parentToolUseId?: string,
) {
  removePlaceholder();
  if (isTextStreaming.current) {
    streamingAppendToLast(setState, content);
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

export interface ChannelMessagesValue {
  channelId: string;
  messages: ChannelState['messages'];
  status: ChannelState['status'];
  stats: ChannelState['stats'];
  isContextCompressed: boolean;
  modifiedFiles: ChannelState['modifiedFiles'];
  terminalSessions: ChannelState['terminalSessions'];
  planComments: ChannelState['planComments'];
  statusText: ChannelState['statusText'];
  usageQuota: ChannelState['usageQuota'];
  contextUsage: ChannelState['contextUsage'];
  accountInfo: ChannelState['accountInfo'];
  experimentGates: ChannelState['experimentGates'];
  isProcessing: boolean;
  isCancelling: boolean;
  setChannelState: SetChannelState;
  sendMessage: (message: string) => void;
  abort: () => void;
  kill: () => void;
  clearMessages: () => void;
  clearModifiedFiles: () => void;
  removeModifiedFile: (path: string) => void;
  addPlanComment: (comment: PlanCommentData) => void;
  clearPlanComments: () => void;
  fetchRawEvents: () => Promise<{ events: unknown[] }>;
  requestUsageUpdate: () => void;
  subscribeRawEvents: (cb: (evt: unknown) => void) => () => void;
  searchFiles: (pattern: string) => Promise<{ files: FileSearchResult[] }>;
  getTerminalContents: () => Promise<{ content: string | null }>;
  openClaudeTerminal: () => Promise<{ success: boolean; error?: string }>;
  forkSession: (
    messageId: string,
  ) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
  rewindToMessage: (
    userMessageId: string,
    dryRun?: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
}

const ChannelMessagesContext = createContext<ChannelMessagesValue | null>(null);

export function useChannelMessages(): ChannelMessagesValue {
  const ctx = useContext(ChannelMessagesContext);
  if (!ctx) throw new Error('useChannelMessages must be used within a ChannelMessagesProvider');
  return ctx;
}

export function ChannelMessagesProvider({
  channelId,
  initialState,
  onTitleChange,
  onStatusChange,
  dequeueMessage,
  messageQueueRef,
  resetStreamingRefsRef,
  children,
}: {
  channelId: string;
  initialState?: ChannelInitialState;
  onTitleChange?: (title: string) => void;
  onStatusChange?: (status: 'default' | 'pending' | 'done') => void;
  dequeueMessage: () => string | undefined;
  messageQueueRef: RefObject<string[]>;
  resetStreamingRefsRef: RefObject<() => void>;
  children: ReactNode;
}) {
  const { socket } = useSocket();

  // ── Own channelState ──
  const [channelState, setChannelState] = useState<ChannelState>(() => ({
    ...initialChannelState(channelId),
    ...initialState,
  }));

  // ── Refs ──
  const isTextStreaming = useRef(false);
  const isThinkingStreaming = useRef(false);
  const wasStreamedViaDelta = useRef(false);

  const dequeueMessageRef = useRef(dequeueMessage);
  dequeueMessageRef.current = dequeueMessage;

  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;
  const onTitleChangeRef = useRef(onTitleChange);
  onTitleChangeRef.current = onTitleChange;

  // ── Join session + cross-window status sync ──
  useEffect(() => {
    if (!channelId) return;
    let joined = false;

    socket.emit('session:join', { channelId }, (snapshot) => {
      if ('error' in snapshot) return;
      setChannelState((prev) => {
        const updated = {
          ...prev,
          status: snapshot.state === 'busy' ? ('busy' as const) : ('idle' as const),
        };
        if (prev.messages.length === 0 && snapshot.events?.length) {
          updated.messages = buildMessagesFromHistory(snapshot.events);
        }
        return updated;
      });
      joined = true;
    });

    function onSessionStates(payload: Parameters<ServerToClientEvents['session:states']>[0]) {
      if (!joined) return;
      const match = payload.sessions.find((s) => s.channelId === channelId);
      if (!match) return;
      setChannelState((prev) => {
        if (prev.status === 'processing' || prev.status === 'cancelling') return prev;
        const next =
          match.state === 'busy'
            ? ('busy' as const)
            : match.state === 'exited'
              ? ('disconnected' as const)
              : ('idle' as const);
        return prev.status === next ? prev : { ...prev, status: next };
      });
    }
    socket.on('session:states', onSessionStates);
    return () => {
      socket.off('session:states', onSessionStates);
    };
  }, [channelId, socket]);

  // ── Status change callback ──
  useEffect(() => {
    if (channelState.status === 'idle' || channelState.status === 'connecting') {
      onStatusChangeRef.current?.('default');
    }
  }, [channelState.status]);

  // ── Title from first user message ──
  const titleSetRef = useRef(false);
  useEffect(() => {
    if (titleSetRef.current) return;
    const firstUserMsg = channelState.messages.find((m) => m.role === 'user' && m.type === 'text');
    if (firstUserMsg) {
      titleSetRef.current = true;
      onTitleChangeRef.current?.(firstUserMsg.content.slice(0, 30));
    }
  }, [channelState.messages]);

  // ── Streaming refs ──
  const resetStreamingRefs = useCallback(() => {
    isTextStreaming.current = false;
    isThinkingStreaming.current = false;
    wasStreamedViaDelta.current = false;
  }, []);
  resetStreamingRefsRef.current = resetStreamingRefs;

  // ── Auto-wiring: state handlers + effect handlers ──
  useEffect(() => {
    if (!socket) return;

    const guard = (p: { channelId: string }) => p.channelId === channelId || p.channelId === '';
    const effectDeps: EffectDeps = { socket, channelId };
    const resetEvents = new Set([
      'system:compact_boundary',
      'error:message',
      'stream:text',
      'stream:tool_summary',
    ]);

    // Collect all events from both maps (state + effect)
    const allEvents = new Set([
      ...Object.keys(messagesHandlers),
      ...Object.keys(messagesEffects),
    ]);

    const wired = [...allEvents].map((event) => {
      const stateHandler = (messagesHandlers as Record<string, ((s: ChannelState, p: never) => ChannelState) | undefined>)[event];
      const effectHandler = (messagesEffects as Record<string, ((d: EffectDeps, p: never) => void) | undefined>)[event];

      const fn = (payload: { channelId: string }) => {
        if (event !== 'disconnect' && !guard(payload)) return;
        if (resetEvents.has(event)) resetStreamingRefs();
        if (stateHandler) setChannelState((prev) => stateHandler(prev, payload as never));
        if (effectHandler) effectHandler(effectDeps, payload as never);
      };
      socket.on(event as never, fn as never);
      return { event, fn };
    });

    return () => {
      for (const { event, fn } of wired) {
        socket.off(event as never, fn as never);
      }
    };
  }, [channelId, socket, resetStreamingRefs]);

  // ── Special: stream:chunk (ref-based, cannot be a pure handler) ──
  useEffect(() => {
    if (!socket) return;
    const guard = (p: { channelId: string }) => p.channelId === channelId || p.channelId === '';

    const setState = setChannelState;
    const removePlaceholder = () => streamingRemovePlaceholder(setState);
    const appendToLastMessage = (content: string) => streamingAppendToLast(setState, content);
    const appendOrCreateText = (content: string, parentToolUseId?: string) =>
      streamingAppendOrCreate(setState, isTextStreaming, removePlaceholder, content, parentToolUseId);

    function onStreamChunk(p: Payload<'stream:chunk'>) {
      if (!guard(p)) return;
      const { chunk, parentToolUseId } = p;
      switch (chunk.kind) {
        case 'text':
          isThinkingStreaming.current = false;
          wasStreamedViaDelta.current = true;
          appendOrCreateText(chunk.content, parentToolUseId);
          break;
        case 'thinking': {
          removePlaceholder();
          if (isThinkingStreaming.current) {
            appendToLastMessage(chunk.content);
          } else {
            isThinkingStreaming.current = true;
            isTextStreaming.current = false;
            wasStreamedViaDelta.current = false;
            setState((prev) => ({
              ...prev,
              messages: [
                ...prev.messages,
                msg({ role: 'assistant', type: 'thinking', content: chunk.content, parentToolUseId }),
              ],
            }));
          }
          break;
        }
        case 'input_json':
          setState((prev) => {
            let lastToolUse: (typeof prev.messages)[number] | undefined;
            for (let i = prev.messages.length - 1; i >= 0; i--) {
              if (prev.messages[i].type === 'tool_use') { lastToolUse = prev.messages[i]; break; }
            }
            if (!lastToolUse) return prev;
            const partial = typeof lastToolUse.meta?.partialInput === 'string' ? lastToolUse.meta.partialInput : '';
            return {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === lastToolUse.id ? { ...m, meta: { ...m.meta, partialInput: partial + chunk.content } } : m,
              ),
            };
          });
          break;
        case 'citations':
          if (chunk.citations && chunk.citations.length > 0) {
            setState((prev) => {
              if (prev.messages.length === 0) return prev;
              const ms = [...prev.messages];
              const last = ms[ms.length - 1];
              const existing = Array.isArray(last.meta?.citations) ? last.meta.citations : [];
              ms[ms.length - 1] = { ...last, meta: { ...last.meta, citations: [...existing, ...(chunk.citations ?? [])] } };
              return { ...prev, messages: ms };
            });
          }
          break;
        case 'signature':
          break;
      }
    }

    socket.on('stream:chunk', onStreamChunk);
    return () => { socket.off('stream:chunk', onStreamChunk); };
  }, [channelId, socket]);

  // ── Special: stream:end (ref-only, no state change) ──
  useEffect(() => {
    if (!socket) return;
    const guard = (p: { channelId: string }) => p.channelId === channelId || p.channelId === '';
    function onStreamEnd(p: Payload<'stream:end'>) {
      if (!guard(p)) return;
      resetStreamingRefs();
    }
    socket.on('stream:end', onStreamEnd);
    return () => { socket.off('stream:end', onStreamEnd); };
  }, [channelId, socket]);

  // ── Special: message:assistant (depends on streaming refs) ──
  useEffect(() => {
    if (!socket) return;
    const guard = (p: { channelId: string }) => p.channelId === channelId || p.channelId === '';

    const setState = setChannelState;
    const removePlaceholder = () => streamingRemovePlaceholder(setState);
    const appendOrCreateText = (content: string, parentToolUseId?: string) =>
      streamingAppendOrCreate(setState, isTextStreaming, removePlaceholder, content, parentToolUseId);

    const fetchFileContentIfNeeded = (block: { toolName: string; input: unknown }, toolMsgId: string) => {
      if (block.toolName !== 'open_file' || !block.input) return;
      const inp = block.input;
      const filePath = isRecord(inp) && 'file_path' in inp ? String(inp.file_path) : undefined;
      if (!filePath) return;
      socket.emit('file:read', { channelId, filePath }, (res) => {
        setState((prev) => {
          const ms = [...prev.messages];
          const idx = ms.findIndex((m) => m.id === toolMsgId);
          if (idx < 0) return prev;
          ms[idx] = { ...ms[idx], meta: { ...ms[idx].meta, fileContent: 'content' in res ? res.content : undefined, fileError: 'error' in res ? res.error : undefined } };
          return { ...prev, messages: ms };
        });
      });
    };

    const handleAssistantContent = (content: ContentBlock[], parentToolUseId?: string) => {
      for (const block of content) {
        if (block.type === 'text') {
          isThinkingStreaming.current = false;
          if (!wasStreamedViaDelta.current) appendOrCreateText(block.text, parentToolUseId);
        } else if (block.type === 'thinking') {
          if (!isThinkingStreaming.current) {
            setState((prev) => ({
              ...prev,
              messages: [...prev.messages, msg({ role: 'assistant', type: 'thinking', content: block.thinking, parentToolUseId })],
            }));
          }
        } else if (block.type === 'tool_use') {
          resetStreamingRefs();
          const toolMsg = msg({ role: 'assistant', type: 'tool_use', content: block.toolName, meta: { toolId: block.toolId, input: block.input }, parentToolUseId });
          setState((prev) => ({ ...prev, messages: [...prev.messages, toolMsg] }));
          fetchFileContentIfNeeded(block, toolMsg.id);
        }
      }
      resetStreamingRefs();
    };

    function onMessageAssistant(p: Payload<'message:assistant'>) {
      if (!guard(p)) return;
      handleAssistantContent(p.content, p.parentToolUseId);
    }

    socket.on('message:assistant', onMessageAssistant);
    return () => { socket.off('message:assistant', onMessageAssistant); };
  }, [channelId, socket]);

  // ── Special: message:result (dequeue + socket.emit) ──
  useEffect(() => {
    if (!socket) return;
    const guard = (p: { channelId: string }) => p.channelId === channelId || p.channelId === '';
    function onMessageResult(p: Payload<'message:result'>) {
      if (!guard(p)) return;
      resetStreamingRefs();
      const stats: ChatStats = {
        costUsd: p.stats.totalCostUsd, durationMs: p.stats.durationMs,
        inputTokens: p.stats.inputTokens, outputTokens: p.stats.outputTokens,
        numTurns: p.stats.numTurns, modelUsage: p.stats.modelUsage,
      };
      setChannelState((prev) => ({
        ...prev, status: 'idle' as const, stats, isContextCompressed: false, statusText: null,
        messages: p.errors?.length
          ? [...prev.messages, msg({ role: 'system', type: 'error', content: p.errors[0] }), msg({ role: 'system', type: 'result', content: '', meta: { stats } })]
          : [...prev.messages, msg({ role: 'system', type: 'result', content: '', meta: { stats } })],
      }));
      const next = dequeueMessageRef.current();
      if (!next) return;
      socket.emit('chat:send', { channelId, message: next });
      setChannelState((prev) => ({ ...prev, status: 'processing' as const }));
    }
    socket.on('message:result', onMessageResult);
    return () => { socket.off('message:result', onMessageResult); };
  }, [channelId, socket]);

  // Side-effect events are now handled by auto-wiring via messagesEffects

  // ── Ref for status used in actions ──
  const statusRef = useRef(channelState.status);
  statusRef.current = channelState.status;

  // ── Stable actions (don't depend on channelState) ──
  const actions = useMemo(
    () => createMessagesActions({ socket, channelId, setChannelState, statusRef, messageQueueRef }),
    [socket, channelId, messageQueueRef],
  );

  // ── Context value (state + stable actions) ──
  const value = useMemo(
    (): ChannelMessagesValue => ({
      channelId,
      messages: channelState.messages,
      status: channelState.status,
      stats: channelState.stats,
      isContextCompressed: channelState.isContextCompressed,
      modifiedFiles: channelState.modifiedFiles,
      terminalSessions: channelState.terminalSessions,
      planComments: channelState.planComments,
      statusText: channelState.statusText,
      usageQuota: channelState.usageQuota,
      contextUsage: channelState.contextUsage,
      accountInfo: channelState.accountInfo,
      experimentGates: channelState.experimentGates,
      isProcessing:
        channelState.status === 'processing' ||
        channelState.status === 'busy' ||
        channelState.status === 'cancelling',
      isCancelling: channelState.status === 'cancelling',
      ...actions,
    }),
    [channelId, channelState, actions],
  );

  return (
    <ChannelMessagesContext.Provider value={value}>{children}</ChannelMessagesContext.Provider>
  );
}
