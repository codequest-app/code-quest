import { z } from 'zod';

export const modelUsageEntrySchema = z.object({
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  cacheReadInputTokens: z.number().optional(),
  cacheCreationInputTokens: z.number().optional(),
  costUSD: z.number().optional(),
  contextWindow: z.number().optional(),
  maxOutputTokens: z.number().optional(),
});
export type ModelUsageEntry = z.infer<typeof modelUsageEntrySchema>;

export const chatStatsSchema = z.object({
  costUsd: z.number().optional(),
  durationMs: z.number().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  numTurns: z.number().optional(),
  modelUsage: z.record(z.string(), modelUsageEntrySchema).optional(),
  contextWindow: z.number().optional(),
});
export type ChatStats = z.infer<typeof chatStatsSchema>;

export const sessionStatsSchema = chatStatsSchema.extend({
  totalCostUsd: z.number().optional(),
  cacheReadInputTokens: z.number().optional(),
  cacheCreationInputTokens: z.number().optional(),
});
export type SessionStats = z.infer<typeof sessionStatsSchema>;
