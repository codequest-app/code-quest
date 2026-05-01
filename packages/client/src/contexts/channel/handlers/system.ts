import type { ToolUseMeta } from '@code-quest/shared';
import type { ChannelState } from '@/types/chat';
import { addMessage, msg, patchMeta } from '@/utils/message';
import type { Payload } from './guard';

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
  const idx = state.messages.findIndex((m) => m.type === 'tool_use' && m.meta.toolId === toolUseId);
  if (idx < 0) return state;
  const messages = [...state.messages];
  const target = messages[idx];
  if (!target) return state;
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
  if (!p.toolUseId) return state;
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

function onErrorMessage(state: ChannelState, p: Payload<'error:message'>): ChannelState {
  return addMessage(state, {
    role: 'system',
    type: 'error',
    content: p.kind ?? p.message,
    ...(p.kind ? { meta: { detail: p.message } } : {}),
  });
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
} satisfies Record<string, (state: ChannelState, payload: never) => ChannelState>;
