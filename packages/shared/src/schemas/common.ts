import { z } from 'zod';

// ── Shared response schemas ──

export const successResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export const controlResponseSchema = z.object({
  success: z.boolean(),
  response: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
});
export type ControlResponse = z.infer<typeof controlResponseSchema>;

export const clientMessageSchema = z.object({
  name: z.string(),
  payload: z.record(z.string(), z.unknown()),
});
export const messageContentSchema = z.object({
  content: z.array(z.object({ type: z.string(), text: z.string() })),
});

export const channelIdPayloadSchema = z.object({ channelId: z.string() });
export type ChannelIdPayload = z.infer<typeof channelIdPayloadSchema>;

export const cancelRequestPayloadSchema = z.object({ targetRequestId: z.string() });
export type CancelRequestPayload = z.infer<typeof cancelRequestPayloadSchema>;

export const channelMetaCacheSchema = z.object({
  model: z.string().optional(),
  tools: z.array(z.string()).optional(),
  permissionMode: z.string().optional(),
  slashCommands: z.array(z.string()).optional(),
  fastModeState: z.unknown().optional(),
  mcpServers: z.array(z.object({ name: z.string(), status: z.string() })).optional(),
});
export type ChannelMetaCache = z.infer<typeof channelMetaCacheSchema>;

// ── Error (moved from notification.ts) ──

export const errorMessagePayloadSchema = z.object({
  channelId: z.string(),
  message: z.string(),
});
export type ErrorMessagePayload = z.infer<typeof errorMessagePayloadSchema>;

// ── Speech (moved from notification.ts) ──

export const speechToTextMessagePayloadSchema = z.object({
  channelId: z.string(),
  text: z.string(),
  done: z.boolean(),
});
export type SpeechToTextMessagePayload = z.infer<typeof speechToTextMessagePayloadSchema>;

// sessionSummarySchema — moved to session.ts
// sessionListResponseSchema — moved to session.ts
