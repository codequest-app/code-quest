import type { ContentBlock, ServerToClientEvents, UsageQuota } from '@code-quest/shared';
import type { ChannelState } from '../../types/chat';
import { msg } from '../../utils/message';

type Payload<E extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[E]>[0];

type TierKey = 'five_hour' | 'seven_day' | 'seven_day_sonnet';
function isTierKey(v: string | undefined): v is TierKey {
  return v === 'five_hour' || v === 'seven_day' || v === 'seven_day_sonnet';
}

// ── Content helpers ──

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
  // ── Session ──

  'session:status': (state: ChannelState, p: Payload<'session:status'>): ChannelState => ({
    ...state,
    statusText: p.status || null,
  }),

  // ── System ──

  'system:compact_boundary': (
    state: ChannelState,
    _p: Payload<'system:compact_boundary'>,
  ): ChannelState => ({
    ...state,
    isContextCompressed: true,
    messages: [
      ...state.messages,
      msg({ role: 'system', type: 'compact_boundary', content: 'Context was compressed' }),
    ],
  }),

  'system:hook_started': (
    state: ChannelState,
    p: Payload<'system:hook_started'>,
  ): ChannelState => ({
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
  }),

  'system:hook_response': (
    state: ChannelState,
    p: Payload<'system:hook_response'>,
  ): ChannelState => {
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
  },

  'system:task_started': (
    state: ChannelState,
    p: Payload<'system:task_started'>,
  ): ChannelState => ({
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
  }),

  'system:api_retry': (state: ChannelState, p: Payload<'system:api_retry'>): ChannelState => ({
    ...state,
    statusText: `Retrying... (${p.attempt}/${p.maxRetries})`,
  }),

  'system:rate_limit': (state: ChannelState, p: Payload<'system:rate_limit'>): ChannelState => {
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
  },

  // ── Error ──

  'error:message': (state: ChannelState, p: Payload<'error:message'>): ChannelState => ({
    ...state,
    messages: [...state.messages, msg({ role: 'system', type: 'error', content: p.message })],
  }),

  // ── Lifecycle ──

  'file:updated': (state: ChannelState, p: Payload<'file:updated'>): ChannelState => ({
    ...state,
    modifiedFiles: {
      ...state.modifiedFiles,
      [p.filePath]: { oldContent: p.oldContent, newContent: p.newContent },
    },
  }),

  'plan:comment_added': (state: ChannelState, p: Payload<'plan:comment_added'>): ChannelState => ({
    ...state,
    planComments: [...state.planComments, p.comment],
  }),

  'plan:comment_removed': (
    state: ChannelState,
    p: Payload<'plan:comment_removed'>,
  ): ChannelState => ({
    ...state,
    planComments: state.planComments.filter((c) => c.id !== p.commentId),
  }),

  // ── Streaming (state-only, no ref dependency) ──

  'stream:text': (state: ChannelState, p: Payload<'stream:text'>): ChannelState => ({
    ...state,
    messages: [
      ...state.messages,
      msg({ role: 'assistant', type: 'streamlined_text', content: p.text }),
    ],
  }),

  'stream:tool_summary': (
    state: ChannelState,
    p: Payload<'stream:tool_summary'>,
  ): ChannelState => ({
    ...state,
    messages: [
      ...state.messages,
      msg({
        role: 'assistant',
        type: 'streamlined_tool_use_summary',
        content: p.toolSummary,
      }),
    ],
  }),

  // ── Global ──

  'settings:update': (state: ChannelState, p: Payload<'settings:update'>): ChannelState => {
    if (p.channelId && p.channelId !== '') return state;
    if (p.accountInfo === undefined) return state;
    return {
      ...state,
      accountInfo: state.accountInfo
        ? { ...state.accountInfo, ...p.accountInfo }
        : (p.accountInfo ?? null),
    };
  },

  'app:experiment_gates': (
    state: ChannelState,
    p: Payload<'app:experiment_gates'>,
  ): ChannelState => ({
    ...state,
    experimentGates: p.gates,
  }),

  'settings:usage': (state: ChannelState, p: Payload<'settings:usage'>): ChannelState => ({
    ...state,
    usageQuota: p.usage,
    ...(p.contextUsage ? { contextUsage: p.contextUsage } : {}),
  }),

  // ── Message ──

  'message:user': (state: ChannelState, p: Payload<'message:user'>): ChannelState =>
    applyUserContent(state, p.content),

  // ── Mixed events (state part only; side effects handled in context) ──

  'notification:show': (state: ChannelState, p: Payload<'notification:show'>): ChannelState => ({
    ...state,
    messages: [...state.messages, msg({ role: 'system', type: 'text', content: p.message })],
  }),

  'raw:event': (state: ChannelState, p: Payload<'raw:event'>): ChannelState => {
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
    if (
      p.rawType === 'new_session_notification' ||
      p.rawType === 'control_request/open_in_editor'
    ) {
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
  },

  disconnect: (state: ChannelState): ChannelState => ({
    ...state,
    status: 'disconnected',
  }),
} satisfies Record<string, (state: ChannelState, payload: never) => ChannelState>;
