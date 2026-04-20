import { z } from 'zod';

export const terminalGetContentsPayloadSchema = z.object({
  channelId: z.string(),
  terminalId: z.string().optional(),
});
export type TerminalGetContentsPayload = z.infer<typeof terminalGetContentsPayloadSchema>;

export const terminalOpenClaudePayloadSchema = z.object({
  channelId: z.string(),
  prompt: z.string().optional(),
  args: z.array(z.string()).optional(),
  cwd: z.string().optional(),
});
export type TerminalOpenClaudePayload = z.infer<typeof terminalOpenClaudePayloadSchema>;

export const terminalGetContentsResponseSchema = z.looseObject({
  content: z.string().nullable(),
});
export type TerminalGetContentsResponse = z.infer<typeof terminalGetContentsResponseSchema>;

export const terminalOpenClaudeResponseSchema = z.looseObject({
  success: z.boolean(),
  channelId: z.string().optional(),
  error: z.string().optional(),
});
export type TerminalOpenClaudeResponse = z.infer<typeof terminalOpenClaudeResponseSchema>;
