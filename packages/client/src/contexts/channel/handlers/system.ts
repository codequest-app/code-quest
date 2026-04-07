import type { ChannelState } from '@/types/chat';
import { addMessage, msg } from '@/utils/message';
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

function onTaskStarted(state: ChannelState, p: Payload<'system:task_started'>): ChannelState {
  return addMessage(state, {
    role: 'system',
    type: 'task_started',
    content: p.description,
    meta: { taskType: p.taskType },
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
  return addMessage(state, { role: 'system', type: 'error', content: p.message });
}

// ── Handler map ──

export const systemHandlerOn = {
  'system:compact_boundary': onCompactBoundary,
  'system:hook_started': onHookStarted,
  'system:hook_response': onHookResponse,
  'system:task_started': onTaskStarted,
  'system:api_retry': onApiRetry,
  'system:rate_limit': onRateLimit,
  'error:message': onErrorMessage,
} satisfies Record<string, (state: ChannelState, payload: never) => ChannelState>;
