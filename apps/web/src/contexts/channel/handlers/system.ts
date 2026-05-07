import type { ToolUseMeta } from '@code-quest/shared';
import type { ChannelState } from '@/types/chat';
import { addMessage, mapSessionStats, msg, patchMeta } from '@/utils/message';
import type { Payload } from './guard.ts';

// ── On handlers ──

function onCompactBoundary(
  state: ChannelState,
  _p: Payload<'system:compact_boundary'>,
): ChannelState {
  return {
    ...addMessage(state, {
      role: 'system',
      type: 'compact_boundary',
      content: 'Context was compressed',
    }),
    isContextCompressed: true,
  };
}

function onHookStarted(state: ChannelState, p: Payload<'system:hook_started'>): ChannelState {
  return addMessage(state, {
    role: 'system',
    type: 'hook_started',
    content: p.hook.hookName,
    meta: { hookId: p.hook.hookId, hookEvent: p.hook.hookEvent },
  });
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

function patchToolUseMeta(
  state: ChannelState,
  toolUseId: string,
  patch: Partial<ToolUseMeta>,
): ChannelState {
  const src = state.messages;
  let idx = src.length - 1;
  while (idx >= 0) {
    const m = src[idx];
    if (m?.type === 'tool_use' && m.meta.toolId === toolUseId) break;
    idx--;
  }
  if (idx < 0) return state;
  const target = src[idx];
  if (!target) return state;
  const messages = [...src];
  messages[idx] = patchMeta(target, patch);
  return { ...state, messages };
}

function onTaskStarted(state: ChannelState, p: Payload<'system:task_started'>): ChannelState {
  const withMessage = addMessage(state, {
    role: 'system',
    type: 'task_started',
    content: p.description,
    meta: { taskType: p.taskType },
  });
  if (!p.toolUseId) return withMessage;
  return patchToolUseMeta(withMessage, p.toolUseId, {
    taskStatus: 'running',
    taskType: p.taskType,
  });
}

function onTaskProgress(state: ChannelState, p: Payload<'system:task_progress'>): ChannelState {
  if (!p.toolUseId) return state;
  return patchToolUseMeta(state, p.toolUseId, {
    taskStatus: 'running',
    lastToolName: p.lastToolName,
  });
}

function onTaskNotification(
  state: ChannelState,
  p: Payload<'system:task_notification'>,
): ChannelState {
  if (!p.toolUseId || !p.status) return state;
  const taskStatus: ToolUseMeta['taskStatus'] = p.status === 'failed' ? 'failed' : 'completed';
  return patchToolUseMeta(state, p.toolUseId, {
    taskStatus,
    taskSummary: p.summary,
    ...(p.usage ? { taskUsage: p.usage } : {}),
  });
}

function onApiRetry(state: ChannelState, p: Payload<'system:api_retry'>): ChannelState {
  return { ...state, statusText: `Retrying... (${p.attempt}/${p.maxRetries})` };
}

function onRateLimit(state: ChannelState, p: Payload<'system:rate_limit'>): ChannelState {
  return addMessage(state, {
    role: 'system',
    type: 'rate_limit_event',
    content: `Rate limit: ${p.info.status}`,
    meta: { rateLimitInfo: p.info },
  });
}

function onResult(state: ChannelState, p: Payload<'message:result'>): ChannelState {
  const stats = mapSessionStats(p.stats);
  const finalized = state.messages.map((m) =>
    m.type === 'thinking' && m.meta?.isStreaming
      ? patchMeta(m, { isStreaming: false, durationMs: stats.durationMs })
      : m,
  );
  const messages = p.isError
    ? finalized
    : [...finalized, msg({ role: 'system', type: 'result', content: '', meta: { stats } })];
  return {
    ...state,
    status: 'idle' as const,
    stats,
    isContextCompressed: false,
    statusText: null,
    messages,
  };
}

function onErrorMessage(state: ChannelState, p: Payload<'error:message'>): ChannelState {
  let messages = state.messages;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role === 'assistant' && m.type === 'text' && m.content === p.message) {
      messages = [...messages.slice(0, i), ...messages.slice(i + 1)];
      break;
    }
  }
  return addMessage(
    { ...state, messages },
    {
      role: 'system',
      type: 'error',
      content: p.kind ?? p.message,
      ...(p.kind ? { meta: { detail: p.message } } : {}),
    },
  );
}

// ── Handler map ──

export const systemHandlerOn: {
  'system:compact_boundary': typeof onCompactBoundary;
  'system:hook_started': typeof onHookStarted;
  'system:hook_response': typeof onHookResponse;
  'system:task_started': typeof onTaskStarted;
  'system:task_progress': typeof onTaskProgress;
  'system:task_notification': typeof onTaskNotification;
  'system:api_retry': typeof onApiRetry;
  'system:rate_limit': typeof onRateLimit;
  'error:message': typeof onErrorMessage;
  'message:result': typeof onResult;
} = {
  'system:compact_boundary': onCompactBoundary,
  'system:hook_started': onHookStarted,
  'system:hook_response': onHookResponse,
  'system:task_started': onTaskStarted,
  'system:task_progress': onTaskProgress,
  'system:task_notification': onTaskNotification,
  'system:api_retry': onApiRetry,
  'system:rate_limit': onRateLimit,
  'error:message': onErrorMessage,
  'message:result': onResult,
} satisfies Record<string, (state: ChannelState, payload: never) => ChannelState>;
