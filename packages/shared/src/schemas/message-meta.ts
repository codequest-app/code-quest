import { z } from 'zod';
import { chatStatsSchema } from './message-stats.ts';

export const toolResultSchema = z.object({
  content: z.string().optional(),
  is_error: z.boolean().optional(),
});
export type ToolResult = z.infer<typeof toolResultSchema>;

export const toolUseMetaSchema = z.object({
  toolId: z.string(),
  input: z.record(z.string(), z.unknown()),
  partialInput: z.string().optional(),
  result: toolResultSchema.optional(),
  fileContent: z.string().optional(),
  fileError: z.string().optional(),
});
export type ToolUseMeta = z.infer<typeof toolUseMetaSchema>;

export const toolResultMetaSchema = z.object({
  toolId: z.string(),
  name: z.string().optional(),
  is_error: z.boolean().optional(),
});
export type ToolResultMeta = z.infer<typeof toolResultMetaSchema>;

export const resultMetaSchema = z.object({
  stats: chatStatsSchema,
});
export type ResultMeta = z.infer<typeof resultMetaSchema>;
