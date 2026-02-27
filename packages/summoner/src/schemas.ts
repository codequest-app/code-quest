import { z } from 'zod';

// --- System events ---

export const cliSystemInitSchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.literal('init'),
  session_id: z.string(),
  cwd: z.string().optional(),
  model: z.string().optional(),
  tools: z.array(z.string()).optional(),
  permissionMode: z.string().optional(),
  claude_code_version: z.string().optional(),
});

export const cliSystemHookStartedSchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.literal('hook_started'),
  hook_id: z.string(),
  hook_name: z.string(),
  hook_event: z.string(),
});

export const cliSystemHookResponseSchema = z.looseObject({
  type: z.literal('system'),
  subtype: z.literal('hook_response'),
  hook_id: z.string(),
  hook_name: z.string(),
  hook_event: z.string(),
});

// --- Assistant event ---

export const cliAssistantSchema = z.looseObject({
  type: z.literal('assistant'),
  message: z.looseObject({
    content: z.array(z.any()).optional(),
  }),
});

// --- User event (echo-back) ---

export const cliUserSchema = z.looseObject({
  type: z.literal('user'),
  message: z.looseObject({}),
});

// --- Result event ---

export const cliResultSchema = z.looseObject({
  type: z.literal('result'),
  subtype: z.string().optional(),
  is_error: z.boolean().optional(),
  duration_ms: z.number().optional(),
  duration_api_ms: z.number().optional(),
  num_turns: z.number().optional(),
  result: z.any().optional(),
  session_id: z.string().optional(),
  total_cost_usd: z.number().optional(),
});

// --- Control response ---

export const cliControlResponseSchema = z.looseObject({
  type: z.literal('control_response'),
  response: z.looseObject({
    subtype: z.string(),
    request_id: z.string(),
    error: z.string().optional(),
  }),
});

// --- Control request (CLI → extension) ---

export const cliControlRequestSchema = z.looseObject({
  type: z.literal('control_request'),
  request: z.looseObject({
    subtype: z.string(),
    tool_name: z.string().optional(),
    tool_use_id: z.string().optional(),
    callback_id: z.string().optional(),
  }),
});

// Inferred types
export type CliSystemInit = z.infer<typeof cliSystemInitSchema>;
export type CliAssistant = z.infer<typeof cliAssistantSchema>;
export type CliUser = z.infer<typeof cliUserSchema>;
export type CliResult = z.infer<typeof cliResultSchema>;
export type CliControlResponse = z.infer<typeof cliControlResponseSchema>;
export type CliControlRequest = z.infer<typeof cliControlRequestSchema>;
