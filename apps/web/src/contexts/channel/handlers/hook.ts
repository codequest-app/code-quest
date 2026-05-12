import type { ChannelState } from '@/types/chat';
import { addMessage, msg } from '@/utils/message';
import type { Payload } from './guard.ts';

function onHookStarted(state: ChannelState, p: Payload<'hook:started'>): ChannelState {
  return addMessage(state, {
    role: 'system',
    type: 'hook_started',
    content: p.hook.hookName,
    hookId: p.hook.hookId,
    hookEvent: p.hook.hookEvent,
    hookName: p.hook.hookName,
  });
}

function onHookResponse(state: ChannelState, p: Payload<'hook:response'>): ChannelState {
  const h = p.hook;
  return {
    ...state,
    messages: [
      ...state.messages,
      msg({
        role: 'system',
        type: 'hook_response',
        content: h.hookName,
        hookId: h.hookId,
        hookEvent: h.hookEvent,
        hookName: h.hookName,
        output: h.output,
      }),
      ...(h.additionalContext
        ? [
            msg({
              role: 'system',
              type: 'hook_diagnostics',
              content: h.hookEventName ?? 'hook',
              diagnostics: h.additionalContext,
            }),
          ]
        : []),
    ],
  };
}

export const hookHandlerOn: {
  'hook:started': typeof onHookStarted;
  'hook:response': typeof onHookResponse;
} = {
  'hook:started': onHookStarted,
  'hook:response': onHookResponse,
} satisfies Record<string, (state: ChannelState, payload: never) => ChannelState>;
