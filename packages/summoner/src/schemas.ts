import { z } from 'zod';

// --- System events ---

export const cliSystemInitSchema = z
  .object({
    type: z.literal('system'),
    subtype: z.literal('init'),
    session_id: z.string(),
    cwd: z.string().optional(),
    model: z.string().optional(),
    tools: z.array(z.string()).optional(),
    permissionMode: z.string().optional(),
    claude_code_version: z.string().optional(),
  })
  .passthrough();

export const cliSystemHookStartedSchema = z
  .object({
    type: z.literal('system'),
    subtype: z.literal('hook_started'),
    hook_id: z.string(),
    hook_name: z.string(),
    hook_event: z.string(),
  })
  .passthrough();

export const cliSystemHookResponseSchema = z
  .object({
    type: z.literal('system'),
    subtype: z.literal('hook_response'),
    hook_id: z.string(),
    hook_name: z.string(),
    hook_event: z.string(),
  })
  .passthrough();

// --- Assistant event ---

export const cliAssistantSchema = z
  .object({
    type: z.literal('assistant'),
    message: z
      .object({
        content: z.array(z.any()).optional(),
      })
      .passthrough(),
  })
  .passthrough();

// --- User event (echo-back) ---

export const cliUserSchema = z
  .object({
    type: z.literal('user'),
    message: z.object({}).passthrough(),
  })
  .passthrough();

// --- Result event ---

export const cliResultSchema = z
  .object({
    type: z.literal('result'),
    subtype: z.string().optional(),
    is_error: z.boolean().optional(),
    duration_ms: z.number().optional(),
    duration_api_ms: z.number().optional(),
    num_turns: z.number().optional(),
    result: z.any().optional(),
    session_id: z.string().optional(),
    total_cost_usd: z.number().optional(),
  })
  .passthrough();

// --- Control response ---

export const cliControlResponseSchema = z
  .object({
    type: z.literal('control_response'),
    response: z
      .object({
        subtype: z.string(),
        request_id: z.string(),
        error: z.string().optional(),
      })
      .passthrough(),
  })
  .passthrough();

// --- Control request (CLI → extension) ---

export const cliControlRequestSchema = z
  .object({
    type: z.literal('control_request'),
    request: z
      .object({
        subtype: z.string(),
        tool_name: z.string().optional(),
        tool_use_id: z.string().optional(),
        callback_id: z.string().optional(),
      })
      .passthrough(),
  })
  .passthrough();

// --- Schema registry keyed by type ---

const schemasByType: Record<string, z.ZodType[]> = {
  system: [cliSystemInitSchema, cliSystemHookStartedSchema, cliSystemHookResponseSchema],
  assistant: [cliAssistantSchema],
  user: [cliUserSchema],
  result: [cliResultSchema],
  control_response: [cliControlResponseSchema],
  control_request: [cliControlRequestSchema],
};

// Ignored types — still valid, just not processed
const ignoredTypes = new Set([
  'rate_limit_event',
  'keep_alive',
  'streamlined_text',
  'streamlined_tool_use_summary',
]);

/**
 * Validate any raw CLI event (including ignored types).
 */
export const claudeRawEventSchema = {
  safeParse(
    data: unknown,
  ): { success: true; data: unknown } | { success: false; error: { message: string } } {
    if (typeof data !== 'object' || data === null || !('type' in data)) {
      return { success: false, error: { message: 'Not an object with type field' } };
    }

    const obj = data as Record<string, unknown>;
    const type = obj.type as string;

    if (ignoredTypes.has(type)) {
      return { success: true, data: obj };
    }

    const schemas = schemasByType[type];
    if (!schemas) {
      return { success: false, error: { message: `Unknown type: ${type}` } };
    }

    const errors: string[] = [];
    for (const schema of schemas) {
      const result = schema.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data };
      }
      errors.push(result.error.message);
    }

    return { success: false, error: { message: errors.join('; ') } };
  },
};

// Inferred types
export type CliSystemInit = z.infer<typeof cliSystemInitSchema>;
export type CliAssistant = z.infer<typeof cliAssistantSchema>;
export type CliUser = z.infer<typeof cliUserSchema>;
export type CliResult = z.infer<typeof cliResultSchema>;
export type CliControlResponse = z.infer<typeof cliControlResponseSchema>;
export type CliControlRequest = z.infer<typeof cliControlRequestSchema>;
