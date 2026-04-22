import { z } from 'zod';

// ── System subtypes ──

export const systemInitSchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.literal('init'),
  session_id: z.string(),
  cwd: z.string().optional(),
  model: z.string().optional(),
  tools: z.array(z.string()).optional(),
  mcp_servers: z.array(z.looseObject({ name: z.string(), status: z.string() })).optional(),
  permissionMode: z.string().optional(),
  slash_commands: z.array(z.string()).optional(),
  fast_mode_state: z.string().optional(),
  current_repo: z.looseObject({ branch: z.string(), is_clean: z.boolean() }).optional(),
  apiKeySource: z.string().optional(),
  claude_code_version: z.string().optional(),
  output_style: z.string().optional(),
  agents: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  plugins: z.array(z.unknown()).optional(),
  uuid: z.string().optional(),
});

export const systemStatusSchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.literal('status'),
  status: z.string().nullable(),
  permissionMode: z.string().optional(),
  uuid: z.string().optional(),
  session_id: z.string().optional(),
});

export const systemHookStartedSchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.literal('hook_started'),
  hook_id: z.string(),
  hook_name: z.string(),
  hook_event: z.string(),
  uuid: z.string().optional(),
  session_id: z.string().optional(),
});

export const systemHookResponseSchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.literal('hook_response'),
  hook_id: z.string(),
  hook_name: z.string(),
  hook_event: z.string(),
  hook_event_name: z.string().optional(),
  output: z.string().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  exit_code: z.number().optional(),
  outcome: z.string().optional(),
  additional_context: z.unknown().optional(),
  uuid: z.string().optional(),
  session_id: z.string().optional(),
});

export const systemCompactBoundarySchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.literal('compact_boundary'),
  compactMetadata: z.looseObject({ preservedSegment: z.boolean().optional() }).optional(),
});

const systemPostTurnSummarySchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.literal('post_turn_summary'),
  summary: z.string().optional(),
});

const systemSessionStateChangedSchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.literal('session_state_changed'),
});

export const systemApiRetrySchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.literal('api_retry'),
  attempt: z.number(),
  max_retries: z.number(),
  retry_delay_ms: z.number().optional(),
  error_status: z.number().optional(),
  error: z.string().optional(),
});

export const systemTaskStartedSchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.literal('task_started'),
  task_id: z.string().optional(),
  tool_use_id: z.string().optional(),
  description: z.string().optional(),
  task_type: z.string().optional(),
  uuid: z.string().optional(),
  session_id: z.string().optional(),
});

export const systemTaskNotificationSchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.literal('task_notification'),
  task_id: z.string(),
  tool_use_id: z.string().optional(),
  status: z.string().optional(),
  output_file: z.string().optional(),
  summary: z.string().optional(),
  usage: z.record(z.string(), z.unknown()).optional(),
  uuid: z.string().optional(),
  session_id: z.string().optional(),
});

export const systemTaskProgressSchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.literal('task_progress'),
  task_id: z.string(),
  tool_use_id: z.string().optional(),
  description: z.string().optional(),
  usage: z.record(z.string(), z.unknown()).optional(),
  last_tool_name: z.string().optional(),
  uuid: z.string().optional(),
  session_id: z.string().optional(),
});

export const systemBridgeStateSchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.literal('bridge_state'),
  state: z.enum(['ready', 'disconnected', 'error']),
  detail: z.string().optional(),
});

export const systemMirrorErrorSchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.literal('mirror_error'),
  error: z.string(),
  key: z.unknown().optional(),
  uuid: z.string().optional(),
  session_id: z.string().optional(),
});

// Fallback for unknown system subtypes
const systemFallbackSchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.string(),
});

// ── Assistant ──

// Shared usage shape — Claude API guarantees these are numbers when present.
const apiUsageSchema = z
  .looseObject({
    input_tokens: z.number().optional(),
    output_tokens: z.number().optional(),
    cache_read_input_tokens: z.number().optional(),
    cache_creation_input_tokens: z.number().optional(),
  })
  .optional();

export const assistantSchema = z.looseObject({
  type: z.literal('assistant'),
  message: z.looseObject({
    model: z.string().optional(),
    id: z.string().optional(),
    role: z.string().optional(),
    content: z.array(z.record(z.string(), z.unknown())).optional(),
    stop_reason: z.string().nullable().optional(),
    usage: apiUsageSchema,
  }),
  parent_tool_use_id: z.string().nullable().optional(),
  session_id: z.string().optional(),
  uuid: z.string().optional(),
});

// ── User ──

export const userSchema = z.looseObject({
  type: z.literal('user'),
  message: z.looseObject({
    role: z.string().optional(),
    // content can be an array (normal messages) or a string (slash command stdout echo)
    content: z.union([z.array(z.record(z.string(), z.unknown())), z.string()]).optional(),
  }),
  parent_tool_use_id: z.string().nullable().optional(),
  session_id: z.string().optional(),
  uuid: z.string().optional(),
  tool_use_result: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  isSynthetic: z.boolean().optional(),
});

// ── Result ──

export const resultSchema = z.looseObject({
  type: z.literal('result'),
  subtype: z.string(),
  is_error: z.boolean().optional(),
  duration_ms: z.number().optional(),
  duration_api_ms: z.number().optional(),
  num_turns: z.number().optional(),
  result: z.string().optional(),
  stop_reason: z.string().nullable().optional(),
  session_id: z.string().optional(),
  total_cost_usd: z.number().optional(),
  usage: apiUsageSchema,
  modelUsage: z.record(z.string(), z.unknown()).optional(),
  errors: z.array(z.string()).optional(),
  uuid: z.string().optional(),
  fast_mode_state: z.string().optional(),
  permission_denials: z.array(z.unknown()).optional(),
  terminal_reason: z.string().optional(),
});

// ── Control request ──

export const controlRequestSchema = z.looseObject({
  type: z.literal('control_request'),
  request_id: z.string(),
  request: z.looseObject({
    subtype: z.string(),
    tool_name: z.string().optional(),
    input: z.unknown().optional(),
    permission_suggestions: z.array(z.record(z.string(), z.unknown())).optional(),
    decision_reason: z.string().optional(),
    tool_use_id: z.string().optional(),
    callback_id: z.string().optional(),
    blocked_path: z.string().nullable().optional(),
    agent_id: z.string().optional(),
    elicitation_id: z.string().optional(),
    mcp_server_name: z.string().optional(),
  }),
});

// ── Control response ──

const controlResponseSchema = z.looseObject({
  type: z.literal('control_response'),
  response: z.looseObject({
    subtype: z.string(),
    request_id: z.string(),
    response: z.record(z.string(), z.unknown()).optional(),
    error: z.string().optional(),
  }),
});

// ── Control cancel request ──

const controlCancelRequestSchema = z.looseObject({
  type: z.literal('control_cancel_request'),
  request_id: z.string(),
});

// ── Stream event ──

export const streamEventSchema = z.looseObject({
  type: z.literal('stream_event'),
  event: z.looseObject({
    type: z.string(),
    index: z.number().optional(),
    delta: z
      .looseObject({
        type: z.string().optional(),
        text: z.string().optional(),
        thinking: z.string().optional(),
        partial_json: z.string().optional(),
        citation: z.unknown().optional(),
        citations: z.array(z.unknown()).optional(),
        signature: z.string().optional(),
      })
      .optional(),
    content_block: z
      .looseObject({
        type: z.string().optional(),
        id: z.string().optional(),
        name: z.string().optional(),
        input: z.record(z.string(), z.unknown()).optional(),
      })
      .optional(),
    message: z.record(z.string(), z.unknown()).optional(),
    usage: z.record(z.string(), z.unknown()).optional(),
  }),
  session_id: z.string().optional(),
  parent_tool_use_id: z.string().nullable().optional(),
  uuid: z.string().optional(),
});

// ── Rate limit event ──

export const rateLimitEventSchema = z.looseObject({
  type: z.literal('rate_limit_event'),
  rate_limit_info: z.looseObject({
    status: z.string(),
    resetsAt: z.union([z.number(), z.string()]).optional(),
    rateLimitType: z.string().optional(),
    utilization: z.union([z.number(), z.record(z.string(), z.unknown())]).optional(),
    overageStatus: z.string().optional(),
    isUsingOverage: z.boolean().optional(),
  }),
  uuid: z.string().optional(),
  session_id: z.string().optional(),
});

// ── Streamlined (fast mode) ──

const streamlinedTextSchema = z.looseObject({
  type: z.literal('streamlined_text'),
  text: z.string(),
  session_id: z.string().optional(),
  uuid: z.string().optional(),
});

const streamlinedToolUseSummarySchema = z.looseObject({
  type: z.literal('streamlined_tool_use_summary'),
  tool_summary: z.string(),
  session_id: z.string().optional(),
  uuid: z.string().optional(),
});

// ── Experiment gates ──

const experimentGatesSchema = z.looseObject({
  type: z.literal('experiment_gates'),
  gates: z.record(z.string(), z.union([z.boolean(), z.string()])),
});

// ── Available models ──

const availableModelsSchema = z.looseObject({
  type: z.literal('available_models'),
  models: z.array(z.string()),
});

// ── Tool use (top-level) ──

const toolUseSchema = z.looseObject({
  type: z.literal('tool_use'),
  id: z.string(),
  name: z.string(),
  input: z.record(z.string(), z.unknown()),
  session_id: z.string().optional(),
  uuid: z.string().optional(),
});

// ── Notification ──

const notificationSchema = z.looseObject({
  type: z.literal('notification'),
  message: z.string(),
  timestamp: z.number().optional(),
  session_id: z.string().optional(),
  uuid: z.string().optional(),
});

// ── New session notification ──

const newSessionNotificationSchema = z.looseObject({
  type: z.literal('new_session_notification'),
  session_id: z.string().optional(),
  uuid: z.string().optional(),
});

// ── Error ──

const errorSchema = z.looseObject({
  type: z.literal('error'),
  error: z.looseObject({ type: z.string(), message: z.string() }),
  session_id: z.string().optional(),
});

// ── Auth URL ──

const authUrlSchema = z.looseObject({
  type: z.literal('auth_url'),
  url: z.string(),
  method: z.string(),
  session_id: z.string().optional(),
  uuid: z.string().optional(),
});

// ── Keep alive ──

const keepAliveSchema = z.looseObject({
  type: z.literal('keep_alive'),
});

// ── Auth status ──

const authStatusSchema = z.looseObject({
  type: z.literal('auth_status'),
  isAuthenticating: z.boolean(),
  output: z.array(z.unknown()),
  account: z.record(z.string(), z.unknown()).optional(),
  uuid: z.string().optional(),
  session_id: z.string().optional(),
});

// ── Raw event (synthesized by runner for unknown/parse-error lines) ──

export const rawEventSchema = z.looseObject({
  type: z.literal('raw_event'),
  rawType: z.string(),
  data: z.record(z.string(), z.unknown()),
});

// ── Speech ──

const speechToTextMessageSchema = z.looseObject({
  type: z.literal('speech_to_text_message'),
  channelId: z.string(),
  text: z.string(),
  done: z.boolean(),
});

// ── Type registry: type string → schema ──

const systemSubtypeRegistry: Record<string, z.ZodType> = {
  init: systemInitSchema,
  status: systemStatusSchema,
  hook_started: systemHookStartedSchema,
  hook_response: systemHookResponseSchema,
  compact_boundary: systemCompactBoundarySchema,
  post_turn_summary: systemPostTurnSummarySchema,
  session_state_changed: systemSessionStateChangedSchema,
  api_retry: systemApiRetrySchema,
  task_started: systemTaskStartedSchema,
  task_notification: systemTaskNotificationSchema,
  task_progress: systemTaskProgressSchema,
  bridge_state: systemBridgeStateSchema,
  mirror_error: systemMirrorErrorSchema,
};

const typeRegistry: Record<string, z.ZodType> = {
  assistant: assistantSchema,
  user: userSchema,
  result: resultSchema,
  control_request: controlRequestSchema,
  control_response: controlResponseSchema,
  control_cancel_request: controlCancelRequestSchema,
  stream_event: streamEventSchema,
  rate_limit_event: rateLimitEventSchema,
  streamlined_text: streamlinedTextSchema,
  streamlined_tool_use_summary: streamlinedToolUseSummarySchema,
  experiment_gates: experimentGatesSchema,
  available_models: availableModelsSchema,
  tool_use: toolUseSchema,
  notification: notificationSchema,
  new_session_notification: newSessionNotificationSchema,
  error: errorSchema,
  auth_url: authUrlSchema,
  auth_status: authStatusSchema,
  keep_alive: keepAliveSchema,
  speech_to_text_message: speechToTextMessageSchema,
};

/**
 * Look up the Zod schema for a given CLI event type (and optional subtype for system events).
 * Returns undefined if the type is unknown.
 */
export function getSchemaForType(type: string, subtype?: string): z.ZodType | undefined {
  if (type === 'system') {
    return (subtype && systemSubtypeRegistry[subtype]) || systemFallbackSchema;
  }
  return typeRegistry[type];
}

/** Set of all known CLI event type strings. */
export const KNOWN_EVENT_TYPES = new Set(['system', ...Object.keys(typeRegistry)]);

/** Union type inferred from all CLI event Zod schemas.
 *
 * NOTE: Hand-maintained alongside `typeRegistry` / `systemSubtypeRegistry`.
 * `z.discriminatedUnion('type', [...])` doesn't fit because system events
 * all share `type: 'system'` and distinguish by `subtype` — zod requires
 * unique discriminant values. Flattening system into top-level types would
 * break the CLI wire contract. If a schema is added, it MUST be appended
 * below AND in the appropriate registry above. */
export type ProtocolMessage =
  | z.infer<typeof systemInitSchema>
  | z.infer<typeof systemStatusSchema>
  | z.infer<typeof systemHookStartedSchema>
  | z.infer<typeof systemHookResponseSchema>
  | z.infer<typeof systemCompactBoundarySchema>
  | z.infer<typeof systemTaskStartedSchema>
  | z.infer<typeof systemTaskNotificationSchema>
  | z.infer<typeof systemTaskProgressSchema>
  | z.infer<typeof systemBridgeStateSchema>
  | z.infer<typeof systemMirrorErrorSchema>
  | z.infer<typeof systemPostTurnSummarySchema>
  | z.infer<typeof systemSessionStateChangedSchema>
  | z.infer<typeof systemFallbackSchema>
  | z.infer<typeof assistantSchema>
  | z.infer<typeof userSchema>
  | z.infer<typeof resultSchema>
  | z.infer<typeof controlRequestSchema>
  | z.infer<typeof controlResponseSchema>
  | z.infer<typeof controlCancelRequestSchema>
  | z.infer<typeof streamEventSchema>
  | z.infer<typeof rateLimitEventSchema>
  | z.infer<typeof streamlinedTextSchema>
  | z.infer<typeof streamlinedToolUseSummarySchema>
  | z.infer<typeof experimentGatesSchema>
  | z.infer<typeof availableModelsSchema>
  | z.infer<typeof toolUseSchema>
  | z.infer<typeof notificationSchema>
  | z.infer<typeof newSessionNotificationSchema>
  | z.infer<typeof errorSchema>
  | z.infer<typeof authUrlSchema>
  | z.infer<typeof authStatusSchema>
  | z.infer<typeof keepAliveSchema>
  | z.infer<typeof rawEventSchema>
  | z.infer<typeof speechToTextMessageSchema>;
