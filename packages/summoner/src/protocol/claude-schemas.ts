import { z } from 'zod';

// ── System subtypes ──

export const systemInitSchema = z
  .object({
    type: z.literal('system'),
    subtype: z.literal('init'),
    session_id: z.string(),
    cwd: z.string().optional(),
    model: z.string().optional(),
    tools: z.array(z.string()).optional(),
    mcp_servers: z.array(z.object({ name: z.string(), status: z.string() }).loose()).optional(),
    permissionMode: z.string().optional(),
    slash_commands: z.array(z.string()).optional(),
    fast_mode_state: z.string().optional(),
    current_repo: z.object({ branch: z.string(), is_clean: z.boolean() }).loose().optional(),
    apiKeySource: z.string().optional(),
    claude_code_version: z.string().optional(),
    output_style: z.string().optional(),
    agents: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    plugins: z.array(z.unknown()).optional(),
    uuid: z.string().optional(),
  })
  .loose();

export const systemStatusSchema = z
  .object({
    type: z.literal('system'),
    subtype: z.literal('status'),
    status: z.string().nullable(),
    permissionMode: z.string().optional(),
    uuid: z.string().optional(),
    session_id: z.string().optional(),
  })
  .loose();

export const systemHookStartedSchema = z
  .object({
    type: z.literal('system'),
    subtype: z.literal('hook_started'),
    hook_id: z.string(),
    hook_name: z.string(),
    hook_event: z.string(),
    uuid: z.string().optional(),
    session_id: z.string().optional(),
  })
  .loose();

export const systemHookResponseSchema = z
  .object({
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
  })
  .loose();

export const systemCompactBoundarySchema = z
  .object({
    type: z.literal('system'),
    subtype: z.literal('compact_boundary'),
    compactMetadata: z.object({ preservedSegment: z.boolean().optional() }).loose().optional(),
  })
  .loose();

export const systemPostTurnSummarySchema = z
  .object({
    type: z.literal('system'),
    subtype: z.literal('post_turn_summary'),
    summary: z.string().optional(),
  })
  .loose();

export const systemSessionStateChangedSchema = z
  .object({
    type: z.literal('system'),
    subtype: z.literal('session_state_changed'),
  })
  .loose();

export const systemApiRetrySchema = z
  .object({
    type: z.literal('system'),
    subtype: z.literal('api_retry'),
    attempt: z.number(),
    max_retries: z.number(),
    retry_delay_ms: z.number().optional(),
    error_status: z.number().optional(),
    error: z.string().optional(),
  })
  .loose();

export const systemTaskStartedSchema = z
  .object({
    type: z.literal('system'),
    subtype: z.literal('task_started'),
    task_id: z.string().optional(),
    tool_use_id: z.string().optional(),
    description: z.string().optional(),
    task_type: z.string().optional(),
    uuid: z.string().optional(),
    session_id: z.string().optional(),
  })
  .loose();

export const systemTaskNotificationSchema = z
  .object({
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
  })
  .loose();

export const systemTaskProgressSchema = z
  .object({
    type: z.literal('system'),
    subtype: z.literal('task_progress'),
    task_id: z.string(),
    tool_use_id: z.string().optional(),
    description: z.string().optional(),
    usage: z.record(z.string(), z.unknown()).optional(),
    last_tool_name: z.string().optional(),
    uuid: z.string().optional(),
    session_id: z.string().optional(),
  })
  .loose();

export const systemBridgeStateSchema = z
  .object({
    type: z.literal('system'),
    subtype: z.literal('bridge_state'),
    state: z.enum(['ready', 'disconnected', 'error']),
    detail: z.string().optional(),
  })
  .loose();

// Fallback for unknown system subtypes
export const systemFallbackSchema = z
  .object({
    type: z.literal('system'),
    subtype: z.string(),
  })
  .loose();

// ── Assistant ──

export const assistantSchema = z
  .object({
    type: z.literal('assistant'),
    message: z
      .object({
        model: z.string().optional(),
        id: z.string().optional(),
        role: z.string().optional(),
        content: z.array(z.record(z.string(), z.unknown())).optional(),
        stop_reason: z.string().nullable().optional(),
        usage: z.record(z.string(), z.unknown()).optional(),
      })
      .loose(),
    parent_tool_use_id: z.string().nullable().optional(),
    session_id: z.string().optional(),
    uuid: z.string().optional(),
  })
  .loose();

// ── User ──

export const userSchema = z
  .object({
    type: z.literal('user'),
    message: z
      .object({
        role: z.string().optional(),
        content: z.array(z.record(z.string(), z.unknown())).optional(),
      })
      .loose(),
    parent_tool_use_id: z.string().nullable().optional(),
    session_id: z.string().optional(),
    uuid: z.string().optional(),
    tool_use_result: z.string().optional(),
  })
  .loose();

// ── Result ──

export const resultSchema = z
  .object({
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
    usage: z
      .object({
        input_tokens: z.number().optional(),
        output_tokens: z.number().optional(),
        cache_read_input_tokens: z.number().optional(),
        cache_creation_input_tokens: z.number().optional(),
      })
      .loose()
      .optional(),
    modelUsage: z.record(z.string(), z.unknown()).optional(),
    errors: z.array(z.string()).optional(),
    uuid: z.string().optional(),
    fast_mode_state: z.string().optional(),
    permission_denials: z.array(z.unknown()).optional(),
  })
  .loose();

// ── Control request ──

export const controlRequestSchema = z
  .object({
    type: z.literal('control_request'),
    request_id: z.string(),
    request: z
      .object({
        subtype: z.string(),
        tool_name: z.string().optional(),
        input: z.unknown().optional(),
        permission_suggestions: z.array(z.unknown()).optional(),
        decision_reason: z.string().optional(),
        tool_use_id: z.string().optional(),
        callback_id: z.string().optional(),
        blocked_path: z.string().nullable().optional(),
        agent_id: z.string().optional(),
        elicitation_id: z.string().optional(),
        mcp_server_name: z.string().optional(),
      })
      .loose(),
  })
  .loose();

// ── Control response ──

export const controlResponseSchema = z
  .object({
    type: z.literal('control_response'),
    response: z
      .object({
        subtype: z.string(),
        request_id: z.string(),
        response: z.record(z.string(), z.unknown()).optional(),
        error: z.string().optional(),
      })
      .loose(),
  })
  .loose();

// ── Control cancel request ──

export const controlCancelRequestSchema = z
  .object({
    type: z.literal('control_cancel_request'),
    request_id: z.string(),
  })
  .loose();

// ── Stream event ──

export const streamEventSchema = z
  .object({
    type: z.literal('stream_event'),
    event: z
      .object({
        type: z.string(),
        index: z.number().optional(),
        delta: z
          .object({
            type: z.string().optional(),
            text: z.string().optional(),
            thinking: z.string().optional(),
            partial_json: z.string().optional(),
            citation: z.unknown().optional(),
            citations: z.array(z.unknown()).optional(),
            signature: z.string().optional(),
          })
          .loose()
          .optional(),
        content_block: z
          .object({
            type: z.string().optional(),
            id: z.string().optional(),
            name: z.string().optional(),
            input: z.record(z.string(), z.unknown()).optional(),
          })
          .loose()
          .optional(),
        message: z.record(z.string(), z.unknown()).optional(),
        usage: z.record(z.string(), z.unknown()).optional(),
      })
      .loose(),
    session_id: z.string().optional(),
    parent_tool_use_id: z.string().nullable().optional(),
    uuid: z.string().optional(),
  })
  .loose();

// ── Rate limit event ──

export const rateLimitEventSchema = z
  .object({
    type: z.literal('rate_limit_event'),
    rate_limit_info: z
      .object({
        status: z.string(),
        resetsAt: z.union([z.number(), z.string()]).optional(),
        rateLimitType: z.string().optional(),
        utilization: z.union([z.number(), z.record(z.string(), z.unknown())]).optional(),
        overageStatus: z.string().optional(),
        isUsingOverage: z.boolean().optional(),
      })
      .loose(),
    uuid: z.string().optional(),
    session_id: z.string().optional(),
  })
  .loose();

// ── Streamlined (fast mode) ──

export const streamlinedTextSchema = z
  .object({
    type: z.literal('streamlined_text'),
    text: z.string(),
    session_id: z.string().optional(),
    uuid: z.string().optional(),
  })
  .loose();

export const streamlinedToolUseSummarySchema = z
  .object({
    type: z.literal('streamlined_tool_use_summary'),
    tool_summary: z.string(),
    session_id: z.string().optional(),
    uuid: z.string().optional(),
  })
  .loose();

// ── Experiment gates ──

export const experimentGatesSchema = z
  .object({
    type: z.literal('experiment_gates'),
    gates: z.record(z.string(), z.union([z.boolean(), z.string()])),
  })
  .loose();

// ── Available models ──

export const availableModelsSchema = z
  .object({
    type: z.literal('available_models'),
    models: z.array(z.string()),
  })
  .loose();

// ── Tool use (top-level) ──

export const toolUseSchema = z
  .object({
    type: z.literal('tool_use'),
    id: z.string(),
    name: z.string(),
    input: z.record(z.string(), z.unknown()),
    session_id: z.string().optional(),
    uuid: z.string().optional(),
  })
  .loose();

// ── Notification ──

export const notificationSchema = z
  .object({
    type: z.literal('notification'),
    message: z.string(),
    timestamp: z.number().optional(),
    session_id: z.string().optional(),
    uuid: z.string().optional(),
  })
  .loose();

// ── New session notification ──

export const newSessionNotificationSchema = z
  .object({
    type: z.literal('new_session_notification'),
    session_id: z.string().optional(),
    uuid: z.string().optional(),
  })
  .loose();

// ── Error ──

export const errorSchema = z
  .object({
    type: z.literal('error'),
    error: z.object({ type: z.string(), message: z.string() }).loose(),
    session_id: z.string().optional(),
  })
  .loose();

// ── Auth URL ──

export const authUrlSchema = z
  .object({
    type: z.literal('auth_url'),
    url: z.string(),
    method: z.string(),
    session_id: z.string().optional(),
    uuid: z.string().optional(),
  })
  .loose();

// ── Keep alive ──

export const keepAliveSchema = z
  .object({
    type: z.literal('keep_alive'),
  })
  .loose();

// ── Auth status ──

export const authStatusSchema = z
  .object({
    type: z.literal('auth_status'),
    isAuthenticating: z.boolean(),
    output: z.array(z.unknown()),
    account: z.record(z.string(), z.unknown()).optional(),
    uuid: z.string().optional(),
    session_id: z.string().optional(),
  })
  .loose();

// ── Speech ──

export const speechToTextMessageSchema = z
  .object({
    type: z.literal('speech_to_text_message'),
    channelId: z.string(),
    text: z.string(),
    done: z.boolean(),
  })
  .loose();

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

/** Union type inferred from all CLI event Zod schemas. */
export type ProtocolEvent =
  | z.infer<typeof systemInitSchema>
  | z.infer<typeof systemStatusSchema>
  | z.infer<typeof systemHookStartedSchema>
  | z.infer<typeof systemHookResponseSchema>
  | z.infer<typeof systemCompactBoundarySchema>
  | z.infer<typeof systemTaskStartedSchema>
  | z.infer<typeof systemTaskNotificationSchema>
  | z.infer<typeof systemTaskProgressSchema>
  | z.infer<typeof systemBridgeStateSchema>
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
  | z.infer<typeof speechToTextMessageSchema>;
