import type { ContentBlock, FileSearchResult, PlanCommentData, ServerToClientEvents, UsageQuota } from '@code-quest/shared';
import type { MutableRefObject } from 'react';
import type { TypedSocket } from '../../../socket/client';
import { channelEmit, rpc } from '../../../socket/rpc';
import type { ChannelState } from '../../../types/chat';
import { msg } from '../../../utils/message';

type Payload<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

type TierKey = 'five_hour' | 'seven_day' | 'seven_day_sonnet';
function isTierKey(v: string | undefined): v is TierKey {
  return v === 'five_hour' || v === 'seven_day' || v === 'seven_day_sonnet';
}

// ── Handlers: (state, payload) → newState ──

function onSessionStatus(state: ChannelState, p: Payload<'session:status'>): ChannelState {
  return { ...state, statusText: p.status || null };
}

function onCompactBoundary(state: ChannelState, _p: Payload<'system:compact_boundary'>): ChannelState {
  return {
    ...state,
    isContextCompressed: true,
    messages: [
      ...state.messages,
      msg({ role: 'system', type: 'compact_boundary', content: 'Context was compressed' }),
    ],
  };
}

function onHookStarted(state: ChannelState, p: Payload<'system:hook_started'>): ChannelState {
  return {
    ...state,
    messages: [
      ...state.messages,
      msg({
        role: 'system',
        type: 'hook_started',
        content: p.hook.hookName,
        meta: { hookId: p.hook.hookId, hookEvent: p.hook.hookEvent },
      }),
    ],
  };
}

function onHookResponse(state: ChannelState, p: Payload<'system:hook_response'>): ChannelState {
  const h = p.hook;
  return {
    ...state,
    messages: [
      ...state.messages,
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
  };
}

function onTaskStarted(state: ChannelState, p: Payload<'system:task_started'>): ChannelState {
  return {
    ...state,
    messages: [
      ...state.messages,
      msg({
        role: 'system',
        type: 'task_started',
        content: p.description,
        meta: { taskType: p.taskType },
      }),
    ],
  };
}

function onApiRetry(state: ChannelState, p: Payload<'system:api_retry'>): ChannelState {
  return { ...state, statusText: `Retrying... (${p.attempt}/${p.maxRetries})` };
}

function onRateLimit(state: ChannelState, p: Payload<'system:rate_limit'>): ChannelState {
  const { rateLimitType, resetsAt, utilization } = p.info;
  const quotaUpdate: Partial<{ usageQuota: UsageQuota }> = {};
  if (isTierKey(rateLimitType)) {
    const currentQuota: UsageQuota = state.usageQuota ?? {};
    quotaUpdate.usageQuota = {
      ...currentQuota,
      [rateLimitType]: {
        utilization: typeof utilization === 'number' ? utilization : 0,
        ...(resetsAt != null
          ? { resets_at: new Date(Number(resetsAt) * 1000).toISOString() }
          : {}),
      },
    };
  }
  return {
    ...state,
    ...quotaUpdate,
    messages: [
      ...state.messages,
      msg({
        role: 'system',
        type: 'rate_limit_event',
        content: `Rate limit: ${p.info.status}`,
        meta: { rateLimitInfo: p.info },
      }),
    ],
  };
}

function onErrorMessage(state: ChannelState, p: Payload<'error:message'>): ChannelState {
  return {
    ...state,
    messages: [...state.messages, msg({ role: 'system', type: 'error', content: p.message })],
  };
}

function onFileUpdated(state: ChannelState, p: Payload<'file:updated'>): ChannelState {
  return {
    ...state,
    modifiedFiles: {
      ...state.modifiedFiles,
      [p.filePath]: { oldContent: p.oldContent, newContent: p.newContent },
    },
  };
}

function onPlanCommentAdded(state: ChannelState, p: Payload<'plan:comment_added'>): ChannelState {
  return { ...state, planComments: [...state.planComments, p.comment] };
}

function onPlanCommentRemoved(state: ChannelState, p: Payload<'plan:comment_removed'>): ChannelState {
  return { ...state, planComments: state.planComments.filter((c) => c.id !== p.commentId) };
}

function onStreamText(state: ChannelState, p: Payload<'stream:text'>): ChannelState {
  return {
    ...state,
    messages: [
      ...state.messages,
      msg({ role: 'assistant', type: 'streamlined_text', content: p.text }),
    ],
  };
}

function onStreamToolSummary(state: ChannelState, p: Payload<'stream:tool_summary'>): ChannelState {
  return {
    ...state,
    messages: [
      ...state.messages,
      msg({
        role: 'assistant',
        type: 'streamlined_tool_use_summary',
        content: p.toolSummary,
      }),
    ],
  };
}

function onSettingsUpdate(state: ChannelState, p: Payload<'settings:update'>): ChannelState {
  if (p.channelId && p.channelId !== '') return state;
  if (p.accountInfo === undefined) return state;
  return {
    ...state,
    accountInfo: state.accountInfo
      ? { ...state.accountInfo, ...p.accountInfo }
      : (p.accountInfo ?? null),
  };
}

function onExperimentGates(state: ChannelState, p: Payload<'app:experiment_gates'>): ChannelState {
  return { ...state, experimentGates: p.gates };
}

function onSettingsUsage(state: ChannelState, p: Payload<'settings:usage'>): ChannelState {
  return {
    ...state,
    usageQuota: p.usage,
    ...(p.contextUsage ? { contextUsage: p.contextUsage } : {}),
  };
}

function onMessageUser(state: ChannelState, p: Payload<'message:user'>): ChannelState {
  return applyUserContent(state, p.content);
}

function onNotificationShow(state: ChannelState, p: Payload<'notification:show'>): ChannelState {
  return {
    ...state,
    messages: [...state.messages, msg({ role: 'system', type: 'text', content: p.message })],
  };
}

function onRawEvent(state: ChannelState, p: Payload<'raw:event'>): ChannelState {
  if (p.rawType === 'tool_use') {
    return {
      ...state,
      messages: [
        ...state.messages,
        msg({
          role: 'assistant',
          type: 'tool_use',
          content: typeof p.data.name === 'string' ? p.data.name : '',
          meta: { toolId: p.data.id, input: p.data.input },
        }),
      ],
    };
  }
  if (p.rawType === 'unknown_delta') {
    return {
      ...state,
      messages: [
        ...state.messages,
        msg({
          role: 'system',
          type: 'unknown_delta',
          content: `Unknown delta: ${p.data.deltaType}`,
          meta: { deltaType: p.data.deltaType, data: p.data },
        }),
      ],
    };
  }
  if (p.rawType === 'new_session_notification' || p.rawType === 'control_request/open_in_editor') {
    return state;
  }
  return {
    ...state,
    messages: [
      ...state.messages,
      msg({
        role: 'system',
        type: 'raw_event',
        content: `Raw: ${p.rawType}`,
        meta: { rawType: p.rawType, data: p.data },
      }),
    ],
  };
}

function onDisconnect(state: ChannelState): ChannelState {
  return { ...state, status: 'disconnected' };
}

// ── Content helper ──

function applyUserContent(state: ChannelState, content: ContentBlock[]): ChannelState {
  let messages = [...state.messages];
  for (const block of content) {
    if (block.type === 'text') {
      const last = messages[messages.length - 1];
      if (last?.role === 'user' && last?.type === 'text' && last?.content === block.text) {
        continue;
      }
      messages = [...messages, msg({ role: 'user', type: 'text', content: block.text })];
    } else if (block.type === 'tool_result') {
      messages = [
        ...messages,
        msg({
          role: 'assistant',
          type: 'tool_result',
          content: String(block.content ?? ''),
          meta: { toolId: block.toolUseId, name: block.toolName },
        }),
      ];
    }
  }
  return { ...state, messages };
}

/**
 * Handler map: event name → pure function `(state, payload) → newState`.
 * No setState, no socket, no side effects, no refs.
 * Guard and on/off are handled by auto-wiring.
 */
export const messagesHandlers = {
  'session:status': onSessionStatus,
  'system:compact_boundary': onCompactBoundary,
  'system:hook_started': onHookStarted,
  'system:hook_response': onHookResponse,
  'system:task_started': onTaskStarted,
  'system:api_retry': onApiRetry,
  'system:rate_limit': onRateLimit,
  'error:message': onErrorMessage,
  'file:updated': onFileUpdated,
  'plan:comment_added': onPlanCommentAdded,
  'plan:comment_removed': onPlanCommentRemoved,
  'stream:text': onStreamText,
  'stream:tool_summary': onStreamToolSummary,
  'settings:update': onSettingsUpdate,
  'app:experiment_gates': onExperimentGates,
  'settings:usage': onSettingsUsage,
  'message:user': onMessageUser,
  'notification:show': onNotificationShow,
  'raw:event': onRawEvent,
  'disconnect': onDisconnect,
} satisfies Record<string, (state: ChannelState, payload: never) => ChannelState>;

// ── Emit actions (send) ──

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

interface MessagesActionsDeps {
  socket: TypedSocket;
  channelId: string;
  setChannelState: (fn: (prev: ChannelState) => ChannelState) => void;
  statusRef: MutableRefObject<string>;
  messageQueueRef: MutableRefObject<string[]>;
}

export function createMessagesActions({
  socket,
  channelId,
  setChannelState,
  statusRef,
  messageQueueRef,
}: MessagesActionsDeps) {
  const emit = (event: string, payload: Record<string, unknown>, ...rest: unknown[]) =>
    channelEmit(socket, channelId, event, payload, ...rest);

  function sendMessage(message: string) {
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
  }

  function abort() {
    emit('chat:cancel', {});
    setChannelState((prev) => ({ ...prev, status: 'cancelling' as const }));
  }

  function kill() {
    emit('session:close', {});
  }

  function clearMessages() {
    setChannelState((prev) => ({ ...prev, messages: [] }));
  }

  function clearModifiedFiles() {
    setChannelState((prev) => ({ ...prev, modifiedFiles: {} }));
  }

  function removeModifiedFile(path: string) {
    setChannelState((prev) => {
      const { [path]: _, ...rest } = prev.modifiedFiles;
      return { ...prev, modifiedFiles: rest };
    });
  }

  function addPlanComment(comment: PlanCommentData) {
    setChannelState((prev) => ({ ...prev, planComments: [...prev.planComments, comment] }));
  }

  function clearPlanComments() {
    setChannelState((prev) => ({ ...prev, planComments: [] }));
  }

  function fetchRawEvents(): Promise<{ events: unknown[] }> {
    return rpc(socket, 'session:raw_events', { channelId });
  }

  function requestUsageUpdate() {
    socket.emit('settings:refresh_usage', { channelId } as never);
  }

  function subscribeRawEvents(cb: (evt: unknown) => void): () => void {
    const handler = (eventName: string, ...args: unknown[]) => {
      const payload = isRecord(args[0]) ? args[0] : undefined;
      if (payload?.channelId && payload.channelId !== channelId) return;
      cb({ type: eventName, ...(payload ?? {}) });
    };
    socket.onAny(handler);
    return () => socket.offAny(handler);
  }

  function searchFiles(pattern: string): Promise<{ files: FileSearchResult[] }> {
    return rpc(socket, 'file:list', { channelId, pattern });
  }

  function getTerminalContents(): Promise<{ content: string | null }> {
    return rpc(socket, 'terminal:read', { channelId });
  }

  function openClaudeTerminal(): Promise<{ success: boolean; error?: string }> {
    return rpc(socket, 'terminal:open_claude', { channelId });
  }

  function forkSession(messageId: string): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    return rpc(socket, 'session:fork', {
      forkedFromSession: channelId,
      resumeSessionAt: messageId,
      newSessionId: crypto.randomUUID(),
    });
  }

  function rewindToMessage(userMessageId: string, dryRun = false): Promise<{ success: boolean; error?: string }> {
    return rpc(socket, 'chat:rewind_code', { channelId, userMessageId, dryRun });
  }

  return {
    setChannelState,
    sendMessage,
    abort,
    kill,
    clearMessages,
    clearModifiedFiles,
    removeModifiedFile,
    addPlanComment,
    clearPlanComments,
    fetchRawEvents,
    requestUsageUpdate,
    subscribeRawEvents,
    searchFiles,
    getTerminalContents,
    openClaudeTerminal,
    forkSession,
    rewindToMessage,
  };
}
