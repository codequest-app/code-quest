import { z } from 'zod';

export const GeminiInitEvent = z.object({
  type: z.literal('init'),
  session_id: z.string(),
  model: z.string().optional(),
  timestamp: z.string().optional(),
});

export const GeminiMessageEvent = z.object({
  type: z.literal('message'),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  delta: z.boolean().optional(),
  timestamp: z.string().optional(),
});

export const GeminiToolUseEvent = z.object({
  type: z.literal('tool_use'),
  tool_name: z.string(),
  tool_id: z.string(),
  parameters: z.unknown(),
  timestamp: z.string().optional(),
});

export const GeminiToolResultEvent = z.object({
  type: z.literal('tool_result'),
  tool_id: z.string(),
  status: z.string(),
  output: z.unknown().optional(),
  timestamp: z.string().optional(),
});

export const GeminiResultEvent = z.object({
  type: z.literal('result'),
  status: z.string(),
  stats: z.object({
    total_tokens: z.number().optional(),
    input_tokens: z.number().optional(),
    output_tokens: z.number().optional(),
    cached: z.number().optional(),
    input: z.number().optional(),
    duration_ms: z.number().optional(),
    tool_calls: z.number().optional(),
  }),
  timestamp: z.string().optional(),
});

export const GeminiStreamLine = z.discriminatedUnion('type', [
  GeminiInitEvent,
  GeminiMessageEvent,
  GeminiToolUseEvent,
  GeminiToolResultEvent,
  GeminiResultEvent,
]);

export type GeminiStreamLineType = z.infer<typeof GeminiStreamLine>;
