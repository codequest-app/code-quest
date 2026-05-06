import { z } from 'zod';

// ── C2S payloads ──

export const chatSendPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; message: z.ZodString },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  message: z.string().min(1),
});
export type ChatSendPayload = z.infer<typeof chatSendPayloadSchema>;

export const chatRespondPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodOptional<z.ZodString>;
    requestId: z.ZodString;
    response: z.ZodRecord<z.ZodString, z.ZodUnknown>;
  },
  z.core.$strip
> = z.object({
  channelId: z.string().optional(),
  requestId: z.string(),
  response: z.record(z.string(), z.unknown()),
});
export type ChatRespondPayload = z.infer<typeof chatRespondPayloadSchema>;

export const chatCancelPayloadSchema: z.ZodObject<{ channelId: z.ZodString }, z.core.$strip> =
  z.object({
    channelId: z.string(),
  });
export type ChatCancelPayload = z.infer<typeof chatCancelPayloadSchema>;

export const chatRewindCodePayloadSchema: z.ZodObject<
  { channelId: z.ZodString; userMessageId: z.ZodOptional<z.ZodString> },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  userMessageId: z.string().optional(),
});
export type ChatRewindCodePayload = z.infer<typeof chatRewindCodePayloadSchema>;

export const chatAskSideQuestionPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; question: z.ZodString },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  question: z.string(),
});
export type ChatAskSideQuestionPayload = z.infer<typeof chatAskSideQuestionPayloadSchema>;

export const sideQuestionResultSchema: z.ZodObject<{ answer: z.ZodString }, z.core.$strip> =
  z.object({ answer: z.string() });
export type SideQuestionResult = z.infer<typeof sideQuestionResultSchema>;

export const chatStopTaskPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; taskId: z.ZodString },
  z.core.$strip
> = z.object({ channelId: z.string(), taskId: z.string() });
export type ChatStopTaskPayload = z.infer<typeof chatStopTaskPayloadSchema>;

export const chatCancelAsyncMessagePayloadSchema: z.ZodObject<
  { channelId: z.ZodString; messageUuid: z.ZodString },
  z.core.$strip
> = z.object({
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
