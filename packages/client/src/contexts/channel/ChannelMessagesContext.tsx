import type {
  ChatStats,
  ForkConversationResponse,
  ListFilesResponse,
  PlanCommentData,
  RawEventsResponse,
  RewindResult,
  ServerToClientEvents,
  SuccessResponse,
  TerminalGetContentsResponse,
} from '@code-quest/shared';
import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { type ChannelInitialState, type ChannelState, initialChannelState } from '../../types/chat';
import { buildMessagesFromHistory, msg } from '../../utils/message';
import { useSocket } from '../SocketContext';
import { createFileActions } from './handlers/file';
import { createGuard, wireHandlers } from './handlers/guard';
import { createMessageActions, messageHandlerOn } from './handlers/message';
import {
  type EffectDeps,
  notificationHandlerEffects,
  notificationHandlerOn,
} from './handlers/notification';
import { createPlanActions, planHandlerOn } from './handlers/plan';
import { createSessionActions, sessionHandlerOn } from './handlers/session';
import { wireStreamingHandlers } from './handlers/streaming';
import { systemHandlerOn } from './handlers/system';

type SetChannelState = (fn: (prev: ChannelState) => ChannelState) => void;
type Payload<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

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
  fetchRawEvents: () => Promise<RawEventsResponse>;
  subscribeRawEvents: (cb: (evt: unknown) => void) => () => void;
  searchFiles: (pattern: string) => Promise<ListFilesResponse>;
  getTerminalContents: () => Promise<TerminalGetContentsResponse>;
  openClaudeTerminal: () => Promise<SuccessResponse>;
  forkSession: (messageId: string) => Promise<ForkConversationResponse>;
  rewindToMessage: (userMessageId: string, dryRun?: boolean) => Promise<RewindResult>;
}

type MessagesStateValue = Pick<
  ChannelMessagesValue,
  | 'channelId'
  | 'messages'
  | 'status'
  | 'stats'
  | 'isContextCompressed'
  | 'modifiedFiles'
  | 'terminalSessions'
  | 'planComments'
  | 'statusText'
  | 'isProcessing'
  | 'isCancelling'
>;
export type MessagesActionsValue = Omit<ChannelMessagesValue, keyof MessagesStateValue>;

const MessagesStateContext = createContext<MessagesStateValue | null>(null);
const MessagesActionsContext = createContext<MessagesActionsValue | null>(null);

export function useChannelMessages(): ChannelMessagesValue {
  const state = useContext(MessagesStateContext);
  const actions = useContext(MessagesActionsContext);
  if (!state || !actions)
    throw new Error('useChannelMessages must be used within a ChannelMessagesProvider');
  return { ...state, ...actions };
}

export function useChannelMessagesActions(): MessagesActionsValue {
  const actions = useContext(MessagesActionsContext);
  if (!actions)
    throw new Error('useChannelMessagesActions must be used within a ChannelMessagesProvider');
  return actions;
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
  const onStatusChangeRef = useRef(onStatusChange);
  const onTitleChangeRef = useRef(onTitleChange);
  useLayoutEffect(() => {
    dequeueMessageRef.current = dequeueMessage;
    onStatusChangeRef.current = onStatusChange;
    onTitleChangeRef.current = onTitleChange;
  });

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
  const resetStreamingRefs = () => {
    isTextStreaming.current = false;
    isThinkingStreaming.current = false;
    wasStreamedViaDelta.current = false;
  };
  useLayoutEffect(() => {
    resetStreamingRefsRef.current = resetStreamingRefs;
  });

  // ── Auto-wiring: state handlers + effect handlers ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: resetStreamingRefs only touches refs
  useEffect(() => {
    if (!socket) return;

    const resetEvents = new Set([
      'system:compact_boundary',
      'error:message',
      'stream:text',
      'stream:tool_summary',
    ]);

    const allHandlers = {
      ...messageHandlerOn,
      ...sessionHandlerOn,
      ...systemHandlerOn,
      ...planHandlerOn,
      ...notificationHandlerOn,
    };

    return wireHandlers<ChannelState, EffectDeps>(socket, channelId, allHandlers, setChannelState, {
      skipGuard: new Set(['disconnect']),
      beforeUpdate(event) {
        if (resetEvents.has(event)) resetStreamingRefs();
      },
      effects: notificationHandlerEffects,
      effectDeps: { socket, channelId },
    });
  }, [channelId, socket]); // resetStreamingRefs only touches refs, stable

  // ── Special: streaming + message:assistant ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: resetStreamingRefs only touches refs
  useEffect(() => {
    if (!socket) return;
    return wireStreamingHandlers({
      socket,
      channelId,
      setState: setChannelState,
      isTextStreaming,
      isThinkingStreaming,
      wasStreamedViaDelta,
      resetStreamingRefs,
    });
  }, [channelId, socket]);

  // ── Special: message:result (dequeue + socket.emit) ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: resetStreamingRefs only touches refs
  useEffect(() => {
    if (!socket) return;
    const guard = createGuard(channelId);
    function onMessageResult(p: Payload<'message:result'>) {
      if (!guard(p)) return;
      resetStreamingRefs();
      const stats: ChatStats = {
        costUsd: p.stats.totalCostUsd,
        durationMs: p.stats.durationMs,
        inputTokens: p.stats.inputTokens,
        outputTokens: p.stats.outputTokens,
        numTurns: p.stats.numTurns,
        modelUsage: p.stats.modelUsage,
      };
      setChannelState((prev) => ({
        ...prev,
        status: 'idle' as const,
        stats,
        isContextCompressed: false,
        statusText: null,
        messages: p.errors?.length
          ? [
              ...prev.messages,
              msg({ role: 'system', type: 'error', content: p.errors[0] }),
              msg({ role: 'system', type: 'result', content: '', meta: { stats } }),
            ]
          : [
              ...prev.messages,
              msg({ role: 'system', type: 'result', content: '', meta: { stats } }),
            ],
      }));
      const next = dequeueMessageRef.current();
      if (!next) return;
      socket.emit('chat:send', { channelId, message: next });
      setChannelState((prev) => ({ ...prev, status: 'processing' as const }));
    }
    socket.on('message:result', onMessageResult);
    return () => {
      socket.off('message:result', onMessageResult);
    };
  }, [channelId, socket]); // resetStreamingRefs only touches refs, stable

  // Side-effect events are now handled by auto-wiring via messagesEffects

  // ── Ref for status used in actions ──
  const statusRef = useRef(channelState.status);
  useLayoutEffect(() => {
    statusRef.current = channelState.status;
  });

  // ── Stable actions (don't depend on channelState) ──
  const [actions] = useState<MessagesActionsValue>(() => ({
    setChannelState,
    ...createMessageActions({ socket, channelId, setChannelState, statusRef, messageQueueRef }),
    ...createSessionActions({ socket, channelId }),
    ...createFileActions({ socket, channelId }),
    ...createPlanActions({ setChannelState }),
    clearMessages: () => setChannelState((prev) => ({ ...prev, messages: [] })),
    clearModifiedFiles: () => setChannelState((prev) => ({ ...prev, modifiedFiles: {} })),
    removeModifiedFile: (path: string) =>
      setChannelState((prev) => {
        const { [path]: _, ...rest } = prev.modifiedFiles;
        return { ...prev, modifiedFiles: rest };
      }),
  }));

  return (
    <MessagesActionsContext.Provider value={actions}>
      <MessagesStateContext.Provider
        value={{
          channelId,
          messages: channelState.messages,
          status: channelState.status,
          stats: channelState.stats,
          isContextCompressed: channelState.isContextCompressed,
          modifiedFiles: channelState.modifiedFiles,
          terminalSessions: channelState.terminalSessions,
          planComments: channelState.planComments,
          statusText: channelState.statusText,
          isProcessing:
            channelState.status === 'processing' ||
            channelState.status === 'busy' ||
            channelState.status === 'cancelling',
          isCancelling: channelState.status === 'cancelling',
        }}
      >
        {children}
      </MessagesStateContext.Provider>
    </MessagesActionsContext.Provider>
  );
}
