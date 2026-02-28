import { z } from 'zod';

// --- Schemas ---

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

export const chatControlResponseSchema = z.object({
  sessionId: z.string(),
  requestId: z.string(),
  response: z.record(z.string(), z.unknown()),
});

// --- Inferred types ---

export type ChatCreatePayload = z.infer<typeof chatCreateSchema>;
export type ChatSendPayload = z.infer<typeof chatSendSchema>;
export type ChatAbortPayload = z.infer<typeof chatAbortSchema>;
export type ChatKillPayload = z.infer<typeof chatKillSchema>;
export type ChatControlResponsePayload = z.infer<typeof chatControlResponseSchema>;
