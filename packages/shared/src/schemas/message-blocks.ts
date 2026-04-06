import { z } from 'zod';

export const textBlockSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});
export type TextBlock = z.infer<typeof textBlockSchema>;

export const thinkingBlockSchema = z.object({
  type: z.literal('thinking'),
  thinking: z.string(),
});
export type ThinkingBlock = z.infer<typeof thinkingBlockSchema>;

export const toolUseBlockSchema = z.object({
  type: z.literal('tool_use'),
  toolId: z.string(),
  toolName: z.string(),
  input: z.unknown(),
});
export type ToolUseBlock = z.infer<typeof toolUseBlockSchema>;

export const toolResultBlockSchema = z.object({
  type: z.literal('tool_result'),
  toolUseId: z.string(),
  toolName: z.string().optional(),
  content: z.unknown(),
  isError: z.boolean().optional(),
});
export type ToolResultBlock = z.infer<typeof toolResultBlockSchema>;

export const contentBlockSchema = z.union([
  textBlockSchema,
  thinkingBlockSchema,
  toolUseBlockSchema,
  toolResultBlockSchema,
]);
export type ContentBlock = z.infer<typeof contentBlockSchema>;
