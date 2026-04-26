import {
  EVENTS,
  type ForkConversationResponse,
  type FsSearchResponse,
  type PlanCommentData,
  type PluginReloadResult,
  type RawEventsResponse,
  type RewindResult,
  type RpcResult,
  type SideQuestionResult,
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
import { createBtwFeature } from '../../features/btw/btw-feature';
import { createClearFeature } from '../../features/clear/clear-feature';
import { createCompactFeature } from '../../features/compact/compact-feature';
import { createNewConversationFeature } from '../../features/new-conversation/new-conversation-feature';
import { createRecapFeature } from '../../features/recap/recap-feature';
import { createReloadPluginsFeature } from '../../features/reload-plugins/reload-plugins-feature';
import { createResumeFeature } from '../../features/resume/resume-feature';
import { createRewindFeature } from '../../features/rewind/rewind-feature';
import { createUsageFeature } from '../../features/usage/usage-feature';
import { createFeatureRegistry } from '../../lib/feature-registry';
import { useMessageRegistryStore } from '../../stores/useMessageRegistryStore';
import { type ChannelChangeUpdate, type ChannelState, initialChannelState } from '../../types/chat';
import {
  buildMessagesFromHistory,
  mapSessionStats,
  msg,
  patchMeta,
  systemMessage,
} from '../../utils/message';
import { useSession } from '../SessionContext';
import { useSocket } from '../SocketContext';
import { useChannelId, useChannelMeta } from './ChannelMetaContext';
import { useChannelSocketRouter } from './ChannelSocketRouterContext';
import { FeatureRegistryContext } from './FeatureRegistryContext';
import { createFileActions } from './handlers/file';
import type { Payload } from './handlers/guard';
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
  addSystemMessage: (type: string, content: string) => void;
  addPlanComment: (comment: PlanCommentData) => void;
  clearPlanComments: () => void;
  fetchRawEvents: () => Promise<RawEventsResponse>;
  subscribeRawEvents: (cb: (evt: unknown) => void) => () => void;
  searchFiles: (pattern: string) => Promise<FsSearchResponse>;
  getTerminalContents: () => Promise<TerminalGetContentsResponse>;
  openClaudeTerminal: () => Promise<RpcResult<{ channelId: string }>>;
  forkSession: (messageId: string) => Promise<ForkConversationResponse>;
  rewindToMessage: (userMessageId: string) => Promise<RpcResult<RewindResult>>;
  askSideQuestion: (question: string) => Promise<RpcResult<SideQuestionResult>>;
  reloadPlugins: () => Promise<PluginReloadResult>;
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
type MessagesActionsValue = Omit<ChannelMessagesValue, keyof MessagesStateValue>;

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
  const { cwd } = useChannelMeta();
  const { socket } = useSocket();

  // ── Feature registry ──
  const registryRef = useRef(createFeatureRegistry());
  const registry = registryRef.current;

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

  function recordJoinError(errorContent: string) {
    joinedRef.current = true; // allow session:states even on join failure
    setChannelState((prev) => ({
      ...prev,
      messages: [...prev.messages, msg({ role: 'system', type: 'error', content: errorContent })],
    }));
  }

  function applyJoinSnapshot(snapshot: {
    state: string;
    events?: Parameters<typeof buildMessagesFromHistory>[0];
  }) {
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
  }

  function joinSession() {
    socket.emit(EVENTS.session.join, { channelId }, (raw: unknown) => {
      const parsed = sessionJoinResponseSchema.safeParse(raw);
      if (!parsed.success || !parsed.data.ok) {
        const errorContent =
          parsed.success && !parsed.data.ok ? parsed.data.error : 'Failed to join session';
        recordJoinError(errorContent);
        return;
      }
      applyJoinSnapshot(parsed.data.data);
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

  const router = useChannelSocketRouter();
  const { subscribeSessionStates } = useSession();

  // ── Join session + cross-window status sync ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: joinSession/onSessionStates use channelId+socket which are in deps
  useEffect(() => {
    if (!channelId) return;
    joinedRef.current = false;
    joinSession();
    return subscribeSessionStates(onSessionStates);
  }, [channelId, socket, subscribeSessionStates]);

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

    const resetEvents = new Set<string>([
      EVENTS.system.compact_boundary,
      EVENTS.error.message,
      EVENTS.stream.text,
      EVENTS.stream.tool_summary,
    ]);

    const allHandlers = {
      ...messageHandlerOn,
      ...sessionHandlerOn,
      ...systemHandlerOn,
      ...planHandlerOn,
      ...notificationHandlerOn,
    };

    return router.register<ChannelState, EffectDeps>(allHandlers, setChannelState, {
      skipGuard: new Set(['disconnect']),
      beforeUpdate(event) {
        if (resetEvents.has(event)) resetStreamingRefs();
      },
      effects: notificationHandlerEffects,
      effectDeps: { socket, channelId },
    });
  }, [channelId, socket, router]); // resetStreamingRefs only touches refs, stable

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
    resetStreamingRefs();
    const stats = mapSessionStats(p.stats);
    setChannelState((prev) => {
      // Finalize thinking blocks: clear isStreaming, set durationMs
      const finalized = prev.messages.map((m) =>
        m.type === 'thinking' && m.meta?.isStreaming
          ? patchMeta(m, { isStreaming: false, durationMs: stats.durationMs })
          : m,
      );
      const base = [
        ...finalized,
        msg({ role: 'system', type: 'result', content: '', meta: { stats } }),
      ];
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
    socket.emit(EVENTS.chat.send, { channelId, message: next });
    setChannelState((prev) => ({ ...prev, status: 'processing' as const }));
  }

  // ── Special: message:result (dequeue + socket.emit) ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: onMessageResult uses channelId+socket which are in deps
  useEffect(() => {
    if (!socket) return;
    return router.on(EVENTS.message.result, onMessageResult);
  }, [channelId, socket, router]);

  // Side-effect events are now handled by auto-wiring via messagesEffects

  // ── Ref for status used in actions ──
  const statusRef = useRef(channelState.status);
  useLayoutEffect(() => {
    statusRef.current = channelState.status;
  });

  // ── Stable actions (don't depend on channelState) ──
  const [actions] = useState<MessagesActionsValue>(() => {
    const sessionActions = createSessionActions({ socket, channelId });
    const messageActions = createMessageActions({
      socket,
      channelId,
      setChannelState,
      statusRef,
      messageQueueRef,
    });
    registry.register(createBtwFeature({ askSideQuestion: sessionActions.askSideQuestion }));
    registry.register(createReloadPluginsFeature(() => sessionActions.reloadPlugins()));
    registry.register(
      createUsageFeature({
        emitRefreshUsage: () => socket.emit(EVENTS.settings.refresh_usage, { channelId }),
      }),
    );
    registry.register(createRewindFeature());
    const clearMessages = () => setChannelState((prev) => ({ ...prev, messages: [] }));
    const clearModifiedFiles = () => setChannelState((prev) => ({ ...prev, modifiedFiles: {} }));
    registry.register(
      createClearFeature({
        clearMessages,
        clearModifiedFiles,
        sendMessage: (msg) => messageActions.sendMessage(msg),
      }),
    );
    registry.register(
      createNewConversationFeature({ sendMessage: (msg) => messageActions.sendMessage(msg) }),
    );
    registry.register(createResumeFeature());
    registry.register(createCompactFeature((msg) => messageActions.sendMessage(msg)));
    registry.register(
      createRecapFeature({
        askSideQuestion: sessionActions.askSideQuestion,
        appendMessage: messageActions.appendMessage,
      }),
    );
    const sendMessage = (message: string) => {
      const feature = registry.findSlashCommand(message);
      if (feature?.slash) {
        feature.slash.invoke(message);
        return;
      }
      messageActions.sendMessage(message);
    };
    return {
      setChannelState,
      ...messageActions,
      sendMessage,
      ...sessionActions,
      ...createFileActions({ socket, channelId, cwd }),
      ...createPlanActions({ setChannelState }),
      addSystemMessage: (type: string, content: string) =>
        setChannelState((prev) => ({
          ...prev,
          messages: [...prev.messages, systemMessage(type, content)],
        })),
      clearMessages,
      clearModifiedFiles,
      removeModifiedFile: (path: string) =>
        setChannelState((prev) => {
          const { [path]: _, ...rest } = prev.modifiedFiles;
          return { ...prev, modifiedFiles: rest };
        }),
    };
  });

  // ── Message Registry: expose messages to workspace-level consumers ──
  const registerToRegistry = useMessageRegistryStore((s) => s.register);
  const updateRegistry = useMessageRegistryStore((s) => s.update);
  const unregisterFromRegistry = useMessageRegistryStore((s) => s.unregister);

  // biome-ignore lint/correctness/useExhaustiveDependencies: register on mount with initial messages; update effect handles subsequent changes
  useEffect(() => {
    registerToRegistry(channelId, { projectCwd: cwd ?? '', messages: channelState.messages });
    return () => unregisterFromRegistry(channelId);
  }, [channelId, cwd, registerToRegistry, unregisterFromRegistry]);

  useEffect(() => {
    updateRegistry(channelId, channelState.messages);
  }, [channelId, channelState.messages, updateRegistry]);

  return (
    <FeatureRegistryContext.Provider value={registry}>
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
    </FeatureRegistryContext.Provider>
  );
}
