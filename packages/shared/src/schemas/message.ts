import { z } from 'zod';

// ── C2S payloads ──

export const chatSendPayloadSchema = z.object({
  channelId: z.string(),
  message: z.string().min(1),
});
export type ChatSendPayload = z.infer<typeof chatSendPayloadSchema>;

export const chatRespondPayloadSchema = z.object({
  channelId: z.string().optional(),
  requestId: z.string(),
  response: z.record(z.string(), z.unknown()),
});
export type ChatRespondPayload = z.infer<typeof chatRespondPayloadSchema>;

export const chatCancelPayloadSchema = z.object({
  channelId: z.string(),
});
export type ChatCancelPayload = z.infer<typeof chatCancelPayloadSchema>;

export const chatRewindCodePayloadSchema = z.object({
  channelId: z.string(),
  userMessageId: z.string().optional(),
  dryRun: z.boolean().optional(),
});
export type ChatRewindCodePayload = z.infer<typeof chatRewindCodePayloadSchema>;

export const chatStopTaskPayloadSchema = z.object({ channelId: z.string(), taskId: z.string() });
export type ChatStopTaskPayload = z.infer<typeof chatStopTaskPayloadSchema>;

export const chatCancelAsyncMessagePayloadSchema = z.object({
  channelId: z.string(),
  messageUuid: z.string(),
});
export type ChatCancelAsyncMessagePayload = z.infer<typeof chatCancelAsyncMessagePayloadSchema>;

// ── Moved to separate files ──
// Message content blocks → ./message-blocks.ts
// Stats schemas → ./message-stats.ts
// Message meta schemas → ./message-meta.ts
// Stream schemas → ./message-stream.ts
// S2C payloads, fileDiff, rewindResult → ./message-payloads.ts
