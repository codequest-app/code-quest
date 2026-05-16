import { z } from 'zod';

export const terminalGetContentsPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; terminalId: z.ZodOptional<z.ZodString> },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  terminalId: z.string().optional(),
});
export type TerminalGetContentsPayload = z.infer<typeof terminalGetContentsPayloadSchema>;

export const terminalOpenClaudePayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    prompt: z.ZodOptional<z.ZodString>;
    args: z.ZodOptional<z.ZodArray<z.ZodString>>;
    cwd: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  prompt: z.string().optional(),
  args: z.array(z.string()).optional(),
  cwd: z.string().optional(),
});
export type TerminalOpenClaudePayload = z.infer<typeof terminalOpenClaudePayloadSchema>;

export const terminalGetContentsResponseSchema: z.ZodObject<
  { content: z.ZodNullable<z.ZodString> },
  z.core.$loose
> = z.looseObject({
  content: z.string().nullable(),
});
export type TerminalGetContentsResponse = z.infer<typeof terminalGetContentsResponseSchema>;

export const terminalOpenClaudeResponseSchema: z.ZodObject<
  {
    success: z.ZodBoolean;
    channelId: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
  },
  z.core.$loose
> = z.looseObject({
  success: z.boolean(),
  channelId: z.string().optional(),
  error: z.string().optional(),
});
export type TerminalOpenClaudeResponse = z.infer<typeof terminalOpenClaudeResponseSchema>;
