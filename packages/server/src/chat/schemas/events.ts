import { z } from 'zod';

export const ChatStatsSchema = z.object({
  costUsd: z.number().optional(),
  durationMs: z.number().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
});

export const ChatStreamEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('init'), data: z.object({ sessionId: z.string() }) }),
  z.object({ type: z.literal('text'), data: z.object({ content: z.string() }) }),
  z.object({ type: z.literal('thinking'), data: z.object({ content: z.string() }) }),
  z.object({
    type: z.literal('tool_use'),
    data: z.object({ id: z.string(), name: z.string(), input: z.unknown() }),
  }),
  z.object({
    type: z.literal('tool_result'),
    data: z.object({ name: z.string(), output: z.unknown() }),
  }),
  z.object({ type: z.literal('result'), data: z.object({ stats: ChatStatsSchema }) }),
  z.object({ type: z.literal('error'), data: z.object({ message: z.string() }) }),
  z.object({
    type: z.literal('permission_request'),
    data: z.object({ toolName: z.string(), description: z.string() }),
  }),
]);

export type ChatStreamEventType = z.infer<typeof ChatStreamEventSchema>;
export type ChatStatsType = z.infer<typeof ChatStatsSchema>;
