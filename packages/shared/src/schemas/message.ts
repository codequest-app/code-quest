import { z } from 'zod';

// ── C2S payloads ──

export const chatSendSchema = z.object({
  channelId: z.string(),
  message: z.string().min(1),
});
export type ChatSendPayload = z.infer<typeof chatSendSchema>;

export const chatRespondSchema = z.object({
  channelId: z.string().optional(),
  requestId: z.string(),
  response: z.record(z.string(), z.unknown()),
});
export type ChatRespondPayload = z.infer<typeof chatRespondSchema>;

export const chatCancelSchema = z.object({
  channelId: z.string(),
});
export type ChatCancelPayload = z.infer<typeof chatCancelSchema>;

export const chatRewindCodeSchema = z.object({
  channelId: z.string(),
  userMessageId: z.string().optional(),
  dryRun: z.boolean().optional(),
});
export type ChatRewindCodePayload = z.infer<typeof chatRewindCodeSchema>;

export const chatStopTaskSchema = z.object({ channelId: z.string(), taskId: z.string() });
export type ChatStopTaskPayload = z.infer<typeof chatStopTaskSchema>;

export const chatCancelAsyncMessageSchema = z.object({
  channelId: z.string(),
  messageUuid: z.string(),
});
export type ChatCancelAsyncMessagePayload = z.infer<typeof chatCancelAsyncMessageSchema>;

// ── Moved to separate files ──
// Message content blocks → ./message-blocks.ts
// Stats schemas → ./message-stats.ts
// Message meta schemas → ./message-meta.ts
// Stream schemas → ./message-stream.ts
// S2C payloads, fileDiff, rewindResult → ./message-payloads.ts
