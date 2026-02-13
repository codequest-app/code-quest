import { z } from 'zod';

export const ClaudeInitEvent = z.object({
  type: z.literal('system'),
  subtype: z.literal('init'),
  session_id: z.string(),
  cwd: z.string().optional(),
  model: z.string().optional(),
  tools: z.array(z.string()).optional(),
  permissionMode: z.string().optional(),
});

const ClaudeTextBlock = z.object({ type: z.literal('text'), text: z.string() });
const ClaudeThinkingBlock = z.object({ type: z.literal('thinking'), thinking: z.string() });
const ClaudeToolUseBlock = z.object({
  type: z.literal('tool_use'),
  id: z.string(),
  name: z.string(),
  input: z.unknown(),
});
const ClaudeToolResultBlock = z.object({
  type: z.literal('tool_result'),
  tool_use_id: z.string().optional(),
  name: z.string().optional(),
  content: z.unknown().optional(),
  output: z.unknown().optional(),
});

export const ClaudeContentBlock = z.discriminatedUnion('type', [
  ClaudeTextBlock,
  ClaudeThinkingBlock,
  ClaudeToolUseBlock,
  ClaudeToolResultBlock,
]);

export const ClaudeAssistantEvent = z.object({
  type: z.literal('assistant'),
  message: z.object({
    model: z.string().optional(),
    id: z.string().optional(),
    content: z.array(ClaudeContentBlock),
    usage: z
      .object({
        input_tokens: z.number().optional(),
        output_tokens: z.number().optional(),
        cache_creation_input_tokens: z.number().optional(),
        cache_read_input_tokens: z.number().optional(),
      })
      .optional(),
    stop_reason: z.string().optional(),
  }),
});

export const ClaudeUserEvent = z.object({
  type: z.literal('user'),
  message: z.unknown(),
});

export const ClaudePermissionEvent = z.object({
  type: z.literal('permission'),
  tool_name: z.string().optional(),
  tool: z.string().optional(),
  description: z.string().optional(),
  message: z.string().optional(),
});

export const ClaudeResultEvent = z.object({
  type: z.literal('result'),
  subtype: z.string().optional(),
  is_error: z.boolean().optional(),
  total_cost_usd: z.number().optional(),
  duration_ms: z.number().optional(),
  num_turns: z.number().optional(),
  usage: z
    .object({
      input_tokens: z.number().optional(),
      output_tokens: z.number().optional(),
    })
    .optional(),
  modelUsage: z
    .record(
      z.string(),
      z.object({
        input_tokens: z.number().optional(),
        output_tokens: z.number().optional(),
      }),
    )
    .optional(),
});

export const ClaudeStreamLine = z.discriminatedUnion('type', [
  ClaudeInitEvent,
  ClaudeAssistantEvent,
  ClaudeUserEvent,
  ClaudePermissionEvent,
  ClaudeResultEvent,
]);

export type ClaudeStreamLineType = z.infer<typeof ClaudeStreamLine>;
