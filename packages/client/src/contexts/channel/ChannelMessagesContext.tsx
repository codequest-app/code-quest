import {
  type ForkConversationResponse,
  type ListFilesResponse,
  type PlanCommentData,
  type RawEventsResponse,
  type RewindResult,
  type SuccessResponse,
  sessionJoinResponseSchema,
  type TerminalGetContentsResponse,
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
import { type ChannelChangeUpdate, type ChannelState, initialChannelState } from '../../types/chat';
import { buildMessagesFromHistory, mapSessionStats, msg, patchMeta } from '../../utils/message';
import { useSocket } from '../SocketContext';
import { useChannelId } from './ChannelIdContext';
import { createFileActions } from './handlers/file';
import { type Payload, wireHandlers } from './handlers/guard';
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

export interface ChannelMessagesValue {
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
  initialState,
  onChange,
  dequeueMessage,
  messageQueueRef,
  resetStreamingRefsRef,
  children,
}: {
  initialState?: Partial<ChannelState>;
  onChange?: (update: ChannelChangeUpdate) => void;
  dequeueMessage: () => string | undefined;
  messageQueueRef: RefObject<string[]>;
  resetStreamingRefsRef: RefObject<() => void>;
  children: ReactNode;
}) {
  const channelId = useChannelId();
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
  const onChangeRef = useRef(onChange);
  useLayoutEffect(() => {
    dequeueMessageRef.current = dequeueMessage;
    onChangeRef.current = onChange;
  });

  const joinedRef = useRef(false);

  function joinSession() {
    socket.emit('session:join', { channelId }, (raw: unknown) => {
      const parsed = sessionJoinResponseSchema.safeParse(raw);
      if (!parsed.success || 'error' in parsed.data) {
        joinedRef.current = true; // allow session:states even on join failure
        const errorContent = parsed.success ? String(parsed.data.error) : 'Failed to join session';
        setChannelState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            msg({ role: 'system', type: 'error', content: errorContent }),
          ],
        }));
        return;
      }
      const snapshot = parsed.data;
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
      joinedRef.current = true;
    });
  }

  function onSessionStates(payload: Payload<'session:states'>) {
    if (!joinedRef.current) return;
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

  // ── Join session + cross-window status sync ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: joinSession/onSessionStates use channelId+socket which are in deps
  useEffect(() => {
    if (!channelId) return;
    joinedRef.current = false;
    joinSession();
    socket.on('session:states', onSessionStates);
    return () => {
      socket.off('session:states', onSessionStates);
    };
  }, [channelId, socket]);

  // ── Status change callback ──
  useEffect(() => {
    onChangeRef.current?.({ status: channelState.status });
  }, [channelState.status]);

  // ── Title from first user message ──
  const titleSetRef = useRef(false);
  useEffect(() => {
    if (titleSetRef.current) return;
    const firstUserMsg = channelState.messages.find((m) => m.role === 'user' && m.type === 'text');
    if (firstUserMsg) {
      titleSetRef.current = true;
      onChangeRef.current?.({ title: firstUserMsg.content.slice(0, 30) });
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

  function onMessageResult(p: Payload<'message:result'>) {
    if (p.channelId !== channelId && p.channelId !== '') return;
    resetStreamingRefs();
    const stats = mapSessionStats(p.stats);
    setChannelState((prev) => {
      // Finalize thinking blocks: clear isStreaming, set durationMs
      const finalized = prev.messages.map((m) =>
        m.type === 'thinking' && m.meta?.isStreaming
          ? patchMeta(m, { isStreaming: false, durationMs: stats.durationMs })
          : m,
      );
      const base = p.errors?.length
        ? [
            ...finalized,
            msg({ role: 'system', type: 'error', content: p.errors[0] }),
            msg({ role: 'system', type: 'result', content: '', meta: { stats } }),
          ]
        : [...finalized, msg({ role: 'system', type: 'result', content: '', meta: { stats } })];
      return {
        ...prev,
        status: 'idle' as const,
        stats,
        isContextCompressed: false,
        statusText: null,
        messages: base,
      };
    });
    const next = dequeueMessageRef.current();
    if (!next) return;
    socket.emit('chat:send', { channelId, message: next });
    setChannelState((prev) => ({ ...prev, status: 'processing' as const }));
  }

  // ── Special: message:result (dequeue + socket.emit) ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: onMessageResult uses channelId+socket which are in deps
  useEffect(() => {
    if (!socket) return;
    socket.on('message:result', onMessageResult);
    return () => {
      socket.off('message:result', onMessageResult);
    };
  }, [channelId, socket]);

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
