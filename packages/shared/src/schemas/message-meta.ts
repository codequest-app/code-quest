import { z } from 'zod';
import { chatStatsSchema } from './message-stats.ts';

// ── Shared primitives reused by UI layers ──

export const messageAttachmentSchema: z.ZodObject<
  {
    filename: z.ZodString;
    startLine: z.ZodOptional<z.ZodNumber>;
    endLine: z.ZodOptional<z.ZodNumber>;
  },
  z.core.$strip
> = z.object({
  filename: z.string(),
  startLine: z.number().optional(),
  endLine: z.number().optional(),
});
export type MessageAttachment = z.infer<typeof messageAttachmentSchema>;

export const messageRoleSchema: z.ZodEnum<{
  user: 'user';
  assistant: 'assistant';
  system: 'system';
}> = z.enum(['user', 'assistant', 'system']);
export type MessageRole = z.infer<typeof messageRoleSchema>;

export const toolResultSchema: z.ZodObject<
  { content: z.ZodOptional<z.ZodString>; is_error: z.ZodOptional<z.ZodBoolean> },
  z.core.$strip
> = z.object({
  content: z.string().optional(),
  is_error: z.boolean().optional(),
});
export type ToolResult = z.infer<typeof toolResultSchema>;

export const toolUseMetaSchema: z.ZodObject<
  {
    toolId: z.ZodString;
    input: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    partialInput: z.ZodOptional<z.ZodString>;
    result: z.ZodOptional<
      z.ZodObject<
        { content: z.ZodOptional<z.ZodString>; is_error: z.ZodOptional<z.ZodBoolean> },
        z.core.$strip
      >
    >;
    fileContent: z.ZodOptional<z.ZodString>;
    fileError: z.ZodOptional<z.ZodString>;
    taskStatus: z.ZodOptional<
      z.ZodEnum<{ running: 'running'; completed: 'completed'; failed: 'failed' }>
    >;
    taskType: z.ZodOptional<z.ZodEnum<{ local_agent: 'local_agent'; subagent: 'subagent' }>>;
    lastToolName: z.ZodOptional<z.ZodString>;
    taskSummary: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  toolId: z.string(),
  input: z.record(z.string(), z.unknown()),
  partialInput: z.string().optional(),
  result: toolResultSchema.optional(),
  fileContent: z.string().optional(),
  fileError: z.string().optional(),
  taskStatus: z.enum(['running', 'completed', 'failed']).optional(),
  taskType: z.enum(['local_agent', 'subagent']).optional(),
  lastToolName: z.string().optional(),
  taskSummary: z.string().optional(),
});
export type ToolUseMeta = z.infer<typeof toolUseMetaSchema>;

export const toolResultMetaSchema: z.ZodObject<
  {
    toolId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    is_error: z.ZodOptional<z.ZodBoolean>;
    arrayContent: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
  },
  z.core.$strip
> = z.object({
  toolId: z.string(),
  name: z.string().optional(),
  is_error: z.boolean().optional(),
  /** Parsed array content (from structured tool_result messages) for rendering. */
  arrayContent: z.array(z.unknown()).optional(),
});
export type ToolResultMeta = z.infer<typeof toolResultMetaSchema>;

export const resultMetaSchema: z.ZodObject<
  {
    stats: z.ZodObject<
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
    >;
  },
  z.core.$strip
> = z.object({
  stats: chatStatsSchema,
});
export type ResultMeta = z.infer<typeof resultMetaSchema>;
