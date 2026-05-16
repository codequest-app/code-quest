import { z } from 'zod';

export const textBlockSchema: z.ZodObject<
  { type: z.ZodLiteral<'text'>; text: z.ZodString },
  z.core.$strip
> = z.object({
  type: z.literal('text'),
  text: z.string(),
});
export type TextBlock = z.infer<typeof textBlockSchema>;

export const thinkingBlockSchema: z.ZodObject<
  { type: z.ZodLiteral<'thinking'>; thinking: z.ZodString },
  z.core.$strip
> = z.object({
  type: z.literal('thinking'),
  thinking: z.string(),
});
export type ThinkingBlock = z.infer<typeof thinkingBlockSchema>;

export const toolUseBlockSchema: z.ZodObject<
  {
    type: z.ZodLiteral<'tool_use'>;
    toolId: z.ZodString;
    toolName: z.ZodString;
    input: z.ZodUnknown;
    model: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  type: z.literal('tool_use'),
  toolId: z.string(),
  toolName: z.string(),
  input: z.unknown(),
  model: z.string().optional(),
});
export type ToolUseBlock = z.infer<typeof toolUseBlockSchema>;

export const toolResultBlockSchema: z.ZodObject<
  {
    type: z.ZodLiteral<'tool_result'>;
    toolUseId: z.ZodString;
    toolName: z.ZodOptional<z.ZodString>;
    content: z.ZodUnknown;
    isError: z.ZodOptional<z.ZodBoolean>;
  },
  z.core.$strip
> = z.object({
  type: z.literal('tool_result'),
  toolUseId: z.string(),
  toolName: z.string().optional(),
  content: z.unknown(),
  isError: z.boolean().optional(),
});
export type ToolResultBlock = z.infer<typeof toolResultBlockSchema>;

export const contentBlockSchema: z.ZodUnion<
  readonly [
    typeof textBlockSchema,
    typeof thinkingBlockSchema,
    typeof toolUseBlockSchema,
    typeof toolResultBlockSchema,
  ]
> = z.union([textBlockSchema, thinkingBlockSchema, toolUseBlockSchema, toolResultBlockSchema]);
export type ContentBlock = z.infer<typeof contentBlockSchema>;
