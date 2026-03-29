import { z } from 'zod';

export const terminalGetContentsSchema = z.object({
  channelId: z.string(),
  terminalId: z.string().optional(),
});
export type TerminalGetContentsPayload = z.infer<typeof terminalGetContentsSchema>;

export const terminalOpenClaudeSchema = z.object({
  channelId: z.string(),
  prompt: z.string().optional(),
  args: z.array(z.string()).optional(),
  cwd: z.string().optional(),
});
export type TerminalOpenClaudePayload = z.infer<typeof terminalOpenClaudeSchema>;

export const terminalGetContentsResponseSchema = z
  .object({
    content: z.string().nullable(),
  })
  .passthrough();
export type TerminalGetContentsResponse = z.infer<typeof terminalGetContentsResponseSchema>;

export const terminalOpenClaudeResponseSchema = z
  .object({
    success: z.boolean(),
    channelId: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();
export type TerminalOpenClaudeResponse = z.infer<typeof terminalOpenClaudeResponseSchema>;
