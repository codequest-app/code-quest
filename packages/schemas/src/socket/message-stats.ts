import { z } from 'zod';

export const modelUsageEntrySchema: z.ZodObject<
  {
    inputTokens: z.ZodOptional<z.ZodNumber>;
    outputTokens: z.ZodOptional<z.ZodNumber>;
    cacheReadInputTokens: z.ZodOptional<z.ZodNumber>;
    cacheCreationInputTokens: z.ZodOptional<z.ZodNumber>;
    costUSD: z.ZodOptional<z.ZodNumber>;
    contextWindow: z.ZodOptional<z.ZodNumber>;
    maxOutputTokens: z.ZodOptional<z.ZodNumber>;
  },
  z.core.$strip
> = z.object({
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  cacheReadInputTokens: z.number().optional(),
  cacheCreationInputTokens: z.number().optional(),
  costUSD: z.number().optional(),
  contextWindow: z.number().optional(),
  maxOutputTokens: z.number().optional(),
});
export type ModelUsageEntry = z.infer<typeof modelUsageEntrySchema>;

export const chatStatsSchema: z.ZodObject<
  {
    costUsd: z.ZodOptional<z.ZodNumber>;
    durationMs: z.ZodOptional<z.ZodNumber>;
    inputTokens: z.ZodOptional<z.ZodNumber>;
    outputTokens: z.ZodOptional<z.ZodNumber>;
    numTurns: z.ZodOptional<z.ZodNumber>;
    modelUsage: z.ZodOptional<
      z.ZodRecord<
        z.ZodString,
        z.ZodObject<
          {
            inputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadInputTokens: z.ZodOptional<z.ZodNumber>;
            cacheCreationInputTokens: z.ZodOptional<z.ZodNumber>;
            costUSD: z.ZodOptional<z.ZodNumber>;
            contextWindow: z.ZodOptional<z.ZodNumber>;
            maxOutputTokens: z.ZodOptional<z.ZodNumber>;
          },
          z.core.$strip
        >
      >
    >;
    contextWindow: z.ZodOptional<z.ZodNumber>;
  },
  z.core.$strip
> = z.object({
  costUsd: z.number().optional(),
  durationMs: z.number().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  numTurns: z.number().optional(),
  modelUsage: z.record(z.string(), modelUsageEntrySchema).optional(),
  contextWindow: z.number().optional(),
});
export type ChatStats = z.infer<typeof chatStatsSchema>;

export const sessionStatsSchema: z.ZodObject<
  {
    costUsd: z.ZodOptional<z.ZodNumber>;
    durationMs: z.ZodOptional<z.ZodNumber>;
    inputTokens: z.ZodOptional<z.ZodNumber>;
    outputTokens: z.ZodOptional<z.ZodNumber>;
    numTurns: z.ZodOptional<z.ZodNumber>;
    modelUsage: z.ZodOptional<
      z.ZodRecord<
        z.ZodString,
        z.ZodObject<
          {
            inputTokens: z.ZodOptional<z.ZodNumber>;
            outputTokens: z.ZodOptional<z.ZodNumber>;
            cacheReadInputTokens: z.ZodOptional<z.ZodNumber>;
            cacheCreationInputTokens: z.ZodOptional<z.ZodNumber>;
            costUSD: z.ZodOptional<z.ZodNumber>;
            contextWindow: z.ZodOptional<z.ZodNumber>;
            maxOutputTokens: z.ZodOptional<z.ZodNumber>;
          },
          z.core.$strip
        >
      >
    >;
    contextWindow: z.ZodOptional<z.ZodNumber>;
    totalCostUsd: z.ZodOptional<z.ZodNumber>;
    cacheReadInputTokens: z.ZodOptional<z.ZodNumber>;
    cacheCreationInputTokens: z.ZodOptional<z.ZodNumber>;
  },
  z.core.$strip
> = chatStatsSchema.extend({
  totalCostUsd: z.number().optional(),
  cacheReadInputTokens: z.number().optional(),
  cacheCreationInputTokens: z.number().optional(),
});
export type SessionStats = z.infer<typeof sessionStatsSchema>;
