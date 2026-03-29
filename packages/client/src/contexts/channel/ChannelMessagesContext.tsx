import type {
  ChatStats,
  ContentBlock,
  FileSearchResult,
  PlanCommentData,
  ServerToClientEvents,
  UsageQuota,
} from '@code-quest/shared';
import {
  createContext,
  type MutableRefObject,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { showNotificationToast } from '../../components/NotificationToast';
import { rpc } from '../../socket/rpc';
import { type ChannelInitialState, type ChannelState, initialChannelState } from '../../types/chat';
import type { SessionStatus } from '../../types/ui';
import { buildMessagesFromHistory, msg } from '../../utils/message';
import { openUrl } from '../../utils/open-url';
import { useSocket } from '../SocketContext';

type SetChannelState = (fn: (prev: ChannelState) => ChannelState) => void;

type Payload<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

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
  isTextStreaming: MutableRefObject<boolean>,
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
  messageQueueRef: MutableRefObject<string[]>;
  resetStreamingRefsRef: MutableRefObject<() => void>;
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

  // ── Join session ──
  useEffect(() => {
    if (!channelId) return;
    socket.emit('session:join', { channelId }, (joinRes) => {
      if ('error' in joinRes) return;
      setChannelState((prev) => {
        const updated = {
          ...prev,
          status: (joinRes.state === 'busy' ? 'busy' : 'idle') as SessionStatus,
        };
        if (prev.messages.length === 0 && joinRes.events?.length) {
          updated.messages = buildMessagesFromHistory(joinRes.events);
        }
        return updated;
      });
    });
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

  // ── Socket message events ──
  useEffect(() => {
    if (!socket) return;

    const resetStreamingRefs = () => {
      isTextStreaming.current = false;
      isThinkingStreaming.current = false;
      wasStreamedViaDelta.current = false;
    };
    resetStreamingRefsRef.current = resetStreamingRefs;

    const setState = setChannelState;
    const guard = (payload: { channelId: string }): boolean =>
      payload.channelId === channelId || payload.channelId === '';

    const removePlaceholder = () => streamingRemovePlaceholder(setState);
    const appendToLastMessage = (content: string) => streamingAppendToLast(setState, content);
    const appendOrCreateText = (content: string, parentToolUseId?: string) =>
      streamingAppendOrCreate(
        setState,
        isTextStreaming,
        removePlaceholder,
        content,
        parentToolUseId,
      );

    // ── Streaming events ──

    const onStreamChunk = (p: Payload<'stream:chunk'>) => {
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
                msg({
                  role: 'assistant',
                  type: 'thinking',
                  content: chunk.content,
                  parentToolUseId,
                }),
              ],
            }));
          }
          break;
        }
        case 'input_json':
          setState((prev) => {
            const lastToolUse = [...prev.messages].reverse().find((m) => m.type === 'tool_use');
            if (!lastToolUse) return prev;
            const partial = (lastToolUse.meta?.partialInput as string) ?? '';
            return {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === lastToolUse.id
                  ? { ...m, meta: { ...m.meta, partialInput: partial + chunk.content } }
                  : m,
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
              const existing = (last.meta?.citations as unknown[]) ?? [];
              ms[ms.length - 1] = {
                ...last,
                meta: { ...last.meta, citations: [...existing, ...(chunk.citations ?? [])] },
              };
              return { ...prev, messages: ms };
            });
          }
          break;
        case 'signature':
          break;
      }
    };

    const onStreamEnd = (p: Payload<'stream:end'>) => {
      if (!guard(p)) return;
      resetStreamingRefs();
    };

    const onStreamText = (p: Payload<'stream:text'>) => {
      if (!guard(p)) return;
      resetStreamingRefs();
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          msg({ role: 'assistant', type: 'streamlined_text', content: p.text }),
        ],
      }));
    };

    const onStreamToolSummary = (p: Payload<'stream:tool_summary'>) => {
      if (!guard(p)) return;
      resetStreamingRefs();
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          msg({
            role: 'assistant',
            type: 'streamlined_tool_use_summary',
            content: p.toolSummary,
          }),
        ],
      }));
    };

    // ── Message events ──

    const fetchFileContentIfNeeded = (
      block: { toolName: string; input: unknown },
      toolMsgId: string,
    ) => {
      if (block.toolName !== 'open_file' || !block.input) return;
      const filePath = (block.input as { file_path?: string }).file_path;
      if (!filePath) return;

      socket.emit('file:read', { channelId, filePath }, (res) => {
        setState((prev) => {
          const ms = [...prev.messages];
          const idx = ms.findIndex((m) => m.id === toolMsgId);
          if (idx < 0) return prev;
          ms[idx] = {
            ...ms[idx],
            meta: {
              ...ms[idx].meta,
              fileContent: 'content' in res ? res.content : undefined,
              fileError: 'error' in res ? res.error : undefined,
            },
          };
          return { ...prev, messages: ms };
        });
      });
    };

    const handleAssistantContent = (content: ContentBlock[], parentToolUseId?: string) => {
      for (const block of content) {
        if (block.type === 'text') {
          isThinkingStreaming.current = false;
          if (!wasStreamedViaDelta.current) {
            appendOrCreateText(block.text, parentToolUseId);
          }
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
          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, toolMsg],
          }));
          fetchFileContentIfNeeded(block, toolMsg.id);
        }
      }
      resetStreamingRefs();
    };

    const handleUserContent = (content: ContentBlock[], parentToolUseId?: string) => {
      for (const block of content) {
        if (block.type === 'text') {
          setState((prev) => {
            const last = prev.messages[prev.messages.length - 1];
            if (last?.role === 'user' && last?.type === 'text' && last?.content === block.text) {
              return prev;
            }
            return {
              ...prev,
              messages: [
                ...prev.messages,
                msg({ role: 'user', type: 'text', content: block.text }),
              ],
            };
          });
        } else if (block.type === 'tool_result') {
          resetStreamingRefs();
          setState((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              msg({
                role: 'assistant',
                type: 'tool_result',
                content: String(block.content ?? ''),
                meta: { toolId: block.toolUseId, name: block.toolName },
                parentToolUseId,
              }),
            ],
          }));
        }
      }
    };

    const onMessageAssistant = (p: Payload<'message:assistant'>) => {
      if (!guard(p)) return;
      handleAssistantContent(p.content, p.parentToolUseId);
    };

    const onMessageUser = (p: Payload<'message:user'>) => {
      if (!guard(p)) return;
      handleUserContent(p.content, p.parentToolUseId);
    };

    const onMessageResult = (p: Payload<'message:result'>) => {
      if (!guard(p)) return;
      resetStreamingRefs();
      const stats: ChatStats = {
        costUsd: p.stats.totalCostUsd,
        durationMs: p.stats.durationMs,
        inputTokens: p.stats.inputTokens,
        outputTokens: p.stats.outputTokens,
        numTurns: p.stats.numTurns,
        modelUsage: p.stats.modelUsage as ChatStats['modelUsage'],
      };
      setState((prev) => ({
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
      setState((prev) => ({ ...prev, status: 'processing' as const }));
    };

    // ── Session events ──

    const onSessionStatus = (p: Payload<'session:status'>) => {
      if (!guard(p)) return;
      setState((prev) => ({ ...prev, statusText: p.status || null }));
    };

    const onCompactBoundary = (p: Payload<'system:compact_boundary'>) => {
      if (!guard(p)) return;
      resetStreamingRefs();
      setState((prev) => ({
        ...prev,
        isContextCompressed: true,
        messages: [
          ...prev.messages,
          msg({ role: 'system', type: 'compact_boundary', content: 'Context was compressed' }),
        ],
      }));
    };

    const onHookStarted = (p: Payload<'system:hook_started'>) => {
      if (!guard(p)) return;
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          msg({
            role: 'system',
            type: 'hook_started',
            content: p.hook.hookName,
            meta: { hookId: p.hook.hookId, hookEvent: p.hook.hookEvent },
          }),
        ],
      }));
    };

    const onHookResponse = (p: Payload<'system:hook_response'>) => {
      if (!guard(p)) return;
      const h = p.hook;
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          msg({
            role: 'system',
            type: 'hook_response',
            content: h.hookName,
            meta: { hookId: h.hookId, hookEvent: h.hookEvent, output: h.output },
          }),
          ...(h.additionalContext
            ? [
                msg({
                  role: 'system',
                  type: 'hook_diagnostics',
                  content: h.hookEventName ?? 'hook',
                  meta: { diagnostics: h.additionalContext },
                }),
              ]
            : []),
        ],
      }));
    };

    const onTaskStarted = (p: Payload<'system:task_started'>) => {
      if (!guard(p)) return;
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          msg({
            role: 'system',
            type: 'task_started',
            content: p.description,
            meta: { taskType: p.taskType },
          }),
        ],
      }));
    };

    // ── Notification events ──

    const onNotificationToast = (p: Payload<'notification:toast'>) => {
      if (!guard(p)) return;
      toast.info(p.message ?? '');
    };

    const onAuthUrl = (p: Payload<'notification:auth_url'>) => {
      if (!guard(p)) return;
      toast.info(`Authentication required (${p.method})`, {
        duration: 30_000,
        action: { label: 'Open', onClick: () => openUrl(p.url) },
      });
    };

    const onActionOpenUrl = (p: Payload<'action:open_url'>) => {
      if (!guard(p)) return;
      openUrl(p.url);
    };

    const onActionOpenFile = (p: Payload<'action:open_file'>) => {
      if (!guard(p)) return;
      const locationStr = p.location
        ? ` (line ${p.location.startLine ?? '?'}${p.location.endLine ? `–${p.location.endLine}` : ''})`
        : '';
      toast.info(`Open file: ${p.filePath}${locationStr}`);
    };

    const onNotificationShow = (p: Payload<'notification:show'> & { requestId?: string }) => {
      if (!guard(p)) return;
      const severity = (p.severity ?? 'info') as 'info' | 'warning' | 'error';
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, msg({ role: 'system', type: 'text', content: p.message })],
      }));
      if (p.buttons?.length && p.requestId) {
        showNotificationToast(p.message ?? '', severity, p.buttons, (response) =>
          socket.emit('chat:respond', {
            channelId,
            requestId: p.requestId as string,
            response,
          }),
        );
        return;
      }
      const showToast =
        severity === 'error' ? toast.error : severity === 'warning' ? toast.warning : toast.info;
      showToast(p.message ?? '');
    };

    // ── Error events ──

    const onErrorMessage = (p: Payload<'error:message'>) => {
      if (!guard(p)) return;
      resetStreamingRefs();
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, msg({ role: 'system', type: 'error', content: p.message })],
      }));
    };

    const onRateLimit = (p: Payload<'system:rate_limit'>) => {
      if (!guard(p)) return;
      const { rateLimitType, resetsAt, utilization } = p.info;
      const tierKey = rateLimitType as 'five_hour' | 'seven_day' | 'seven_day_sonnet' | undefined;
      setState((prev) => {
        const quotaUpdate: Partial<{ usageQuota: UsageQuota }> = {};
        if (tierKey === 'five_hour' || tierKey === 'seven_day' || tierKey === 'seven_day_sonnet') {
          const currentQuota: UsageQuota = (prev.usageQuota ?? {}) as UsageQuota;
          const util = utilization as Record<string, number> | undefined;
          quotaUpdate.usageQuota = {
            ...currentQuota,
            [tierKey]: {
              utilization: typeof util === 'number' ? util : 0,
              ...(resetsAt != null
                ? { resets_at: new Date(Number(resetsAt) * 1000).toISOString() }
                : {}),
            },
          };
        }
        return {
          ...prev,
          ...quotaUpdate,
          messages: [
            ...prev.messages,
            msg({
              role: 'system',
              type: 'rate_limit_event',
              content: `Rate limit: ${p.info.status}`,
              meta: { rateLimitInfo: p.info },
            }),
          ],
        };
      });
    };

    const onApiRetry = (p: Payload<'system:api_retry'>) => {
      if (!guard(p)) return;
      setChannelState((prev) => ({
        ...prev,
        statusText: `Retrying... (${p.attempt}/${p.maxRetries})`,
      }));
    };

    // ── Lifecycle events ──

    const onFileUpdated = (p: Payload<'file_updated'>) => {
      if (!guard(p)) return;
      setState((prev) => ({
        ...prev,
        modifiedFiles: {
          ...prev.modifiedFiles,
          [p.filePath]: { oldContent: p.oldContent, newContent: p.newContent },
        },
      }));
    };

    const onPlanComment = (p: Payload<'plan_comment'>) => {
      if (!guard(p)) return;
      setState((prev) => ({ ...prev, planComments: [...prev.planComments, p.comment] }));
    };

    const onRemoveComment = (p: Payload<'removeComment'>) => {
      if (!guard(p)) return;
      setState((prev) => ({
        ...prev,
        planComments: prev.planComments.filter((c) => c.id !== p.commentId),
      }));
    };

    const onRawEvent = (p: Payload<'raw:event'>) => {
      if (!guard(p)) return;
      if (p.rawType === 'tool_use') {
        setState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            msg({
              role: 'assistant',
              type: 'tool_use',
              content: (p.data.name as string) ?? '',
              meta: { toolId: p.data.id, input: p.data.input },
            }),
          ],
        }));
        return;
      }
      if (p.rawType === 'unknown_delta') {
        setState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            msg({
              role: 'system',
              type: 'unknown_delta',
              content: `Unknown delta: ${p.data.deltaType}`,
              meta: { deltaType: p.data.deltaType, data: p.data },
            }),
          ],
        }));
        return;
      }
      if (p.rawType === 'new_session_notification') {
        toast.info('New session started');
        return;
      }
      if (p.rawType === 'control_request/open_in_editor') {
        toast.info('Open in Editor is not supported in web mode');
        socket.emit('chat:respond', {
          channelId,
          requestId: p.data.requestId as string,
          response: { behavior: 'allow' },
        });
        return;
      }

      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          msg({
            role: 'system',
            type: 'raw_event',
            content: `Raw: ${p.rawType}`,
            meta: { rawType: p.rawType, data: p.data },
          }),
        ],
      }));
    };

    // ── Global events ──

    const onStateUpdate = (p: Payload<'state:update'>) => {
      if (p.channelId && p.channelId !== '') return;
      if (p.accountInfo === undefined) return;
      setState((prev) => ({
        ...prev,
        accountInfo: prev.accountInfo
          ? { ...prev.accountInfo, ...p.accountInfo }
          : (p.accountInfo ?? null),
      }));
    };

    const onExperimentGates = (p: Payload<'system:experiment_gates'>) => {
      if (!guard(p)) return;
      setState((prev) => ({ ...prev, experimentGates: p.gates as Record<string, boolean> }));
    };

    const onStateUsage = (p: Payload<'state:usage'>) => {
      if (!guard(p)) return;
      setState((prev) => ({ ...prev, usageQuota: p.usage }));
    };

    const onDisconnect = () => {
      setState((prev) => ({ ...prev, status: 'disconnected' }));
      toast.warning('Disconnected from server');
    };

    // ── Register all events ──

    socket.on('stream:chunk', onStreamChunk);
    socket.on('stream:end', onStreamEnd);
    socket.on('stream:text', onStreamText);
    socket.on('stream:tool_summary', onStreamToolSummary);

    socket.on('message:assistant', onMessageAssistant);
    socket.on('message:user', onMessageUser);
    socket.on('message:result', onMessageResult);

    socket.on('session:status', onSessionStatus);
    socket.on('system:compact_boundary', onCompactBoundary);
    socket.on('system:hook_started', onHookStarted);
    socket.on('system:hook_response', onHookResponse);
    socket.on('system:task_started', onTaskStarted);

    socket.on('notification:toast', onNotificationToast);
    socket.on('notification:auth_url', onAuthUrl);
    socket.on('action:open_url', onActionOpenUrl);
    socket.on('action:open_file', onActionOpenFile);
    socket.on('notification:show', onNotificationShow);

    socket.on('error:message', onErrorMessage);
    socket.on('system:rate_limit', onRateLimit);
    socket.on('system:api_retry', onApiRetry);

    socket.on('file_updated', onFileUpdated);
    socket.on('plan_comment', onPlanComment);
    socket.on('removeComment', onRemoveComment);
    socket.on('raw:event', onRawEvent);

    socket.on('state:update', onStateUpdate);
    socket.on('system:experiment_gates', onExperimentGates);
    socket.on('state:usage', onStateUsage);

    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('stream:chunk', onStreamChunk);
      socket.off('stream:end', onStreamEnd);
      socket.off('stream:text', onStreamText);
      socket.off('stream:tool_summary', onStreamToolSummary);

      socket.off('message:assistant', onMessageAssistant);
      socket.off('message:user', onMessageUser);
      socket.off('message:result', onMessageResult);

      socket.off('session:status', onSessionStatus);
      socket.off('system:compact_boundary', onCompactBoundary);
      socket.off('system:hook_started', onHookStarted);
      socket.off('system:hook_response', onHookResponse);
      socket.off('system:task_started', onTaskStarted);

      socket.off('notification:toast', onNotificationToast);
      socket.off('notification:auth_url', onAuthUrl);
      socket.off('action:open_url', onActionOpenUrl);
      socket.off('action:open_file', onActionOpenFile);
      socket.off('notification:show', onNotificationShow);

      socket.off('error:message', onErrorMessage);
      socket.off('system:rate_limit', onRateLimit);
      socket.off('system:api_retry', onApiRetry);

      socket.off('file_updated', onFileUpdated);
      socket.off('plan_comment', onPlanComment);
      socket.off('removeComment', onRemoveComment);
      socket.off('raw:event', onRawEvent);

      socket.off('state:update', onStateUpdate);
      socket.off('system:experiment_gates', onExperimentGates);
      socket.off('state:usage', onStateUsage);

      socket.off('disconnect', onDisconnect);
    };
  }, [channelId, socket, resetStreamingRefsRef]);

  // ── Ref for status used in actions ──
  const statusRef = useRef(channelState.status);
  statusRef.current = channelState.status;

  // ── Stable actions (don't depend on channelState) ──
  const actions = useMemo(() => {
    const emit = (event: string, payload: Record<string, unknown>, ...rest: unknown[]) => {
      (socket.emit as (...a: unknown[]) => unknown)(event, { channelId, ...payload }, ...rest);
    };

    const sendMessage = (message: string) => {
      if (statusRef.current === 'processing') {
        if (messageQueueRef.current.length < 10) messageQueueRef.current.push(message);
      } else {
        emit('chat:send', { message });
      }
      setChannelState((s) => ({
        ...s,
        messages: [...s.messages, msg({ role: 'user', type: 'text', content: message })],
        ...(s.status !== 'processing' ? { status: 'processing' as const } : {}),
      }));
    };

    return {
      setChannelState,
      sendMessage,
      abort: () => {
        emit('chat:cancel', {});
        setChannelState((prev) => ({ ...prev, status: 'cancelling' as const }));
      },
      kill: () => emit('session:close', {}),
      clearMessages: () => setChannelState((prev) => ({ ...prev, messages: [] })),
      clearModifiedFiles: () => setChannelState((prev) => ({ ...prev, modifiedFiles: {} })),
      removeModifiedFile: (path: string) =>
        setChannelState((prev) => {
          const { [path]: _, ...rest } = prev.modifiedFiles;
          return { ...prev, modifiedFiles: rest };
        }),
      addPlanComment: (comment: PlanCommentData) =>
        setChannelState((prev) => ({ ...prev, planComments: [...prev.planComments, comment] })),
      clearPlanComments: () => setChannelState((prev) => ({ ...prev, planComments: [] })),
      fetchRawEvents: () => rpc(socket, 'session:raw_events', { channelId }),
      subscribeRawEvents: (cb: (evt: unknown) => void) => {
        const handler = (eventName: string, ...args: unknown[]) => {
          const payload = args[0] as Record<string, unknown> | undefined;
          if (payload?.channelId && payload.channelId !== channelId) return;
          cb({ type: eventName, ...((payload as object) ?? {}) });
        };
        socket.onAny(handler);
        return () => socket.offAny(handler);
      },
      searchFiles: (pattern: string) => rpc(socket, 'list_files_request', { channelId, pattern }),
      getTerminalContents: () => rpc(socket, 'terminal:get_contents', { channelId }),
      openClaudeTerminal: () => rpc(socket, 'terminal:open_claude', { channelId }),
      forkSession: (messageId: string) =>
        rpc(socket, 'fork_conversation', {
          forkedFromSession: channelId,
          resumeSessionAt: messageId,
          newSessionId: crypto.randomUUID(),
        }),
      rewindToMessage: (userMessageId: string, dryRun = false) =>
        rpc(socket, 'rewind_code', { channelId, userMessageId, dryRun }),
    };
  }, [socket, channelId, messageQueueRef]);

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
