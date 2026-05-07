import {
  EVENTS,
  type ForkConversationResponse,
  type FsSearchResponse,
  fsReadResponseSchema,
  isRecord,
  type PlanCommentData,
  type PluginReloadResult,
  type RawEventsResponse,
  type RewindResult,
  type RpcResult,
  type SideQuestionResult,
  type TerminalGetContentsResponse,
} from '@code-quest/shared';
import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createBtwFeature } from '@/features/btw/btw-feature';
import { createClearFeature } from '@/features/clear/clear-feature';
import { createCompactFeature } from '@/features/compact/compact-feature';
import { createNewConversationFeature } from '@/features/new-conversation/new-conversation-feature';
import { createRecapFeature } from '@/features/recap/recap-feature';
import { createReloadPluginsFeature } from '@/features/reload-plugins/reload-plugins-feature';
import { createResumeFeature } from '@/features/resume/resume-feature';
import { createRewindFeature } from '@/features/rewind/rewind-feature';
import { createUsageFeature } from '@/features/usage/usage-feature';
import { createFeatureRegistry, type FeatureRegistry } from '@/lib/feature-registry';
import type { TypedSocket } from '@/socket/client';
import { useMessageRegistryStore } from '@/stores/useMessageRegistryStore';
import { type ChannelChangeUpdate, type ChannelState, initialChannelState } from '@/types/chat';
import { msg, patchMeta, systemMessage } from '@/utils/message';
import { useSession } from '../SessionContext.tsx';
import { useSocket } from '../SocketContext.tsx';
import { useChannelId, useChannelMeta } from './ChannelMetaContext.tsx';
import { useChannelSocketRouter } from './ChannelSocketRouterContext.tsx';
import { FeatureRegistryContext } from './FeatureRegistryContext.tsx';
import { createFileActions } from './handlers/file.ts';
import type { Payload } from './handlers/guard.ts';
import { historyHandlers, liveHandlers } from './handlers/handler-sets.ts';
import { applyHistoryBatch, shouldApplyBatch } from './handlers/history.ts';
import { parseJoinResponse } from './handlers/join.ts';
import { createMessageActions } from './handlers/message.ts';
import { type EffectContext, notificationHandlerEffects } from './handlers/notification.ts';
import { createPlanActions } from './handlers/plan.ts';
import { createSessionActions, onSessionClosed, onSessionStatus } from './handlers/session.ts';
import { resetStreaming } from './handlers/streaming.ts';

const resetStreamingEvents = new Set<string>([
  EVENTS.system.compact_boundary,
  EVENTS.error.message,
  EVENTS.stream.text,
  EVENTS.stream.tool_summary,
]);

type SetChannelState = (fn: (prev: ChannelState) => ChannelState) => void;

function fetchOpenFileContent(
  socket: TypedSocket,
  block: { toolId?: string; input?: unknown },
  setChannelState: SetChannelState,
): void {
  const filePath =
    isRecord(block.input) && 'file_path' in block.input ? String(block.input.file_path) : undefined;
  if (!filePath) return;
  socket.emit(EVENTS.fs.read, { path: filePath }, (raw: unknown) => {
    const parsed = fsReadResponseSchema.safeParse(raw);
    if (!parsed.success) return;
    const res = parsed.data;
    setChannelState((prev) => {
      const ms = [...prev.messages];
      const idx = ms.findIndex(
        (m) => (m.meta as { toolId?: string } | undefined)?.toolId === block.toolId,
      );
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

export interface ChannelMessagesValue {
  messages: ChannelState['messages'];
  historyMessages: ChannelState['historyMessages'];
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
  | 'historyMessages'
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

function registerMessageFeatures(
  registry: FeatureRegistry,
  ctx: {
    socket: TypedSocket;
    channelId: string;
    sessionActions: ReturnType<typeof createSessionActions>;
    messageActions: ReturnType<typeof createMessageActions>;
    clearMessages: () => void;
    clearModifiedFiles: () => void;
  },
) {
  const { socket, channelId, sessionActions, messageActions, clearMessages, clearModifiedFiles } =
    ctx;
  registry.register(createBtwFeature({ askSideQuestion: sessionActions.askSideQuestion }));
  registry.register(createReloadPluginsFeature(() => sessionActions.reloadPlugins()));
  registry.register(
    createUsageFeature({
      emitRefreshUsage: () => socket.emit(EVENTS.settings.refresh_usage, { channelId }),
    }),
  );
  registry.register(createRewindFeature());
  registry.register(
    createClearFeature({
      clearMessages,
      clearModifiedFiles,
      sendMessage: (m) => messageActions.sendMessage(m),
    }),
  );
  registry.register(
    createNewConversationFeature({ sendMessage: (m) => messageActions.sendMessage(m) }),
  );
  registry.register(createResumeFeature());
  registry.register(createCompactFeature((m) => messageActions.sendMessage(m)));
  registry.register(
    createRecapFeature({
      askSideQuestion: sessionActions.askSideQuestion,
      appendMessage: messageActions.appendMessage,
    }),
  );
}

function buildMessagesActions(ctx: {
  socket: TypedSocket;
  channelId: string;
  cwd?: string;
  setChannelState: SetChannelState;
  statusRef: RefObject<string>;
  messageQueueRef: RefObject<string[]>;
  registry: FeatureRegistry;
}): MessagesActionsValue {
  const { socket, channelId, cwd, setChannelState, statusRef, messageQueueRef, registry } = ctx;
  const sessionActions = createSessionActions({ socket, channelId });
  const messageActions = createMessageActions({
    socket,
    channelId,
    setChannelState,
    statusRef,
    messageQueueRef,
  });
  const clearMessages = () => setChannelState((prev) => ({ ...prev, messages: [] }));
  const clearModifiedFiles = () => setChannelState((prev) => ({ ...prev, modifiedFiles: {} }));
  registerMessageFeatures(registry, {
    socket,
    channelId,
    sessionActions,
    messageActions,
    clearMessages,
    clearModifiedFiles,
  });
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
}

function useTitleFromFirstMessage(
  messages: ChannelState['messages'],
  onChangeRef: RefObject<((update: ChannelChangeUpdate) => void) | undefined>,
): void {
  const titleSetRef = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: onChangeRef.current is a stable ref, not a reactive dep
  useEffect(() => {
    if (titleSetRef.current) return;
    const firstUserMsg = messages.find((m) => m.role === 'user' && m.type === 'text');
    if (firstUserMsg) {
      titleSetRef.current = true;
      onChangeRef.current?.({ title: firstUserMsg.content.slice(0, 30) });
    }
  }, [messages]);
}

export function ChannelMessagesProvider({
  readyToJoin,
  initialState,
  onChange,
  onJoinSettled,
  dequeueMessage,
  messageQueueRef,
  children,
}: {
  readyToJoin: boolean;
  initialState?: Partial<ChannelState>;
  onChange?: (update: ChannelChangeUpdate) => void;
  onJoinSettled?: () => void;
  dequeueMessage: () => string | undefined;
  messageQueueRef: RefObject<string[]>;
  children: ReactNode;
}): React.JSX.Element {
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
  const dequeueMessageRef = useRef(dequeueMessage);
  const onChangeRef = useRef(onChange);
  useLayoutEffect(() => {
    dequeueMessageRef.current = dequeueMessage;
    onChangeRef.current = onChange;
  });

  const joinedRef = useRef(false);
  const historyReplayIdRef = useRef<string | null>(null);

  function recordJoinError(errorContent: string) {
    joinedRef.current = true;
    onJoinSettled?.();
    setChannelState((prev) => ({
      ...prev,
      messages: [...prev.messages, msg({ role: 'system', type: 'error', content: errorContent })],
    }));
  }

  function onJoinSuccess(snapshot: { state: string }) {
    setChannelState((prev) => ({
      ...prev,
      status: snapshot.state === 'busy' ? ('busy' as const) : ('idle' as const),
    }));
    joinedRef.current = true;
    onJoinSettled?.();
  }

  function joinSession() {
    socket.emit(EVENTS.session.join, { channelId }, (raw: unknown) => {
      const result = parseJoinResponse(raw);
      if (!result.ok) {
        recordJoinError(result.error);
        return;
      }
      onJoinSuccess({ state: result.state });
    });
  }

  function onSessionStates(payload: Payload<'session:states'>) {
    if (!joinedRef.current) return;
    const match = payload.sessions.find((s) => s.channelId === channelId);
    if (!match) return;
    setChannelState((prev) => {
      if (
        prev.status === 'processing' ||
        prev.status === 'cancelling' ||
        prev.status === 'disconnected'
      )
        return prev;
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

  // ── Join session (gated on readyToJoin) ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: joinSession uses channelId+socket which are in deps
  useEffect(() => {
    if (!readyToJoin) return;
    joinedRef.current = false;
    historyReplayIdRef.current = null;
    joinSession();
  }, [channelId, readyToJoin, socket]);

  // ── Cross-window status sync ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: onSessionStates uses channelId which is in deps
  useEffect(() => {
    return subscribeSessionStates(onSessionStates);
  }, [channelId, socket, subscribeSessionStates]);

  // ── Status change callback ──
  useEffect(() => {
    onChangeRef.current?.({ status: channelState.status });
  }, [channelState.status]);

  useTitleFromFirstMessage(channelState.messages, onChangeRef);

  // ── Auto-wiring: state handlers + effect handlers ──
  useEffect(() => {
    if (!socket) return;
    return router.register<ChannelState, EffectContext>(liveHandlers, setChannelState, {
      skipGuard: new Set(['disconnect']),
      beforeUpdate(event) {
        if (resetStreamingEvents.has(event)) {
          setChannelState((s) => {
            if (!s.isTextStreaming && !s.isThinkingStreaming && !s.wasStreamedViaDelta) return s;
            return { ...s, ...resetStreaming };
          });
        }
      },
      sideEffects: { handlers: notificationHandlerEffects, ctx: { socket, channelId } },
    });
  }, [channelId, socket, router]);

  // ── Special: session lifecycle events (excluded from liveHandlers to prevent replay) ──
  useEffect(() => {
    if (!socket) return;
    const off1 = router.on(EVENTS.session.closed, (p) =>
      setChannelState((s) => onSessionClosed(s, p)),
    );
    const off2 = router.on(EVENTS.session.status, (p) =>
      setChannelState((s) => onSessionStatus(s, p)),
    );
    return () => {
      off1();
      off2();
    };
  }, [socket, router]);

  // ── Special: message:assistant open_file side-effect ──
  useEffect(() => {
    if (!socket) return;
    return router.on(EVENTS.message.assistant, (p: Payload<'message:assistant'>) => {
      for (const block of p.content) {
        if (block.type !== 'tool_use' || block.toolName !== 'open_file' || !block.input) continue;
        fetchOpenFileContent(socket, block, setChannelState);
      }
    });
  }, [socket, router]);

  // ── Special: message:result dequeue side-effect ──
  useEffect(() => {
    if (!socket) return;
    return router.on(EVENTS.message.result, () => {
      const next = dequeueMessageRef.current();
      if (!next) return;
      socket.emit(EVENTS.chat.send, { channelId, message: next });
      setChannelState((prev) => ({ ...prev, status: 'processing' as const }));
    });
  }, [channelId, socket, router]);

  // ── session:history: replay stored events through live handlers ──
  useEffect(() => {
    if (!socket) return;
    return router.on(EVENTS.session.history, (payload) => {
      const isFirstBatch = historyReplayIdRef.current === null;
      if (!shouldApplyBatch(historyReplayIdRef, payload.replayId)) return;
      setChannelState((prev) => {
        // Skip first batch if live events already arrived (socket was already watching the channel).
        // Subsequent batches of the same replay are always applied.
        if (isFirstBatch && prev.messages.length > 0) return prev;
        return applyHistoryBatch(prev, payload.events, historyHandlers);
      });
    });
  }, [socket, router]);

  // ── Ref for status used in actions ──
  const statusRef = useRef(channelState.status);
  useLayoutEffect(() => {
    statusRef.current = channelState.status;
  });

  // ── Actions (rebuilt when socket/channelId/cwd change) ──
  const actions = useMemo<MessagesActionsValue>(
    () =>
      buildMessagesActions({
        socket,
        channelId,
        cwd,
        setChannelState,
        statusRef,
        messageQueueRef,
        registry,
      }),
    [socket, channelId, cwd, messageQueueRef, registry],
  );

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
            historyMessages: channelState.historyMessages,
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
