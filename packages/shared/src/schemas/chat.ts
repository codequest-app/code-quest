import { z } from 'zod';

export const chatCreateSchema = z.object({
  resumeSessionId: z.string().optional(),
});

export const chatSendSchema = z.object({
  sessionId: z.string(),
  message: z.string().min(1),
});

export const chatAbortSchema = z.object({
  sessionId: z.string(),
});

export const chatKillSchema = z.object({
  sessionId: z.string(),
});

export type ChatCreatePayload = z.infer<typeof chatCreateSchema>;
export type ChatSendPayload = z.infer<typeof chatSendSchema>;
export type ChatAbortPayload = z.infer<typeof chatAbortSchema>;
export type ChatKillPayload = z.infer<typeof chatKillSchema>;
