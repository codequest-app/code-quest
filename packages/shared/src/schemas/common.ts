import { z } from 'zod';

// ── Shared response schemas ──

export const successResponseSchema: z.ZodObject<
  { success: z.ZodBoolean; error: z.ZodOptional<z.ZodString> },
  z.core.$strip
> = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export const controlResponseSchema: z.ZodObject<
  {
    success: z.ZodBoolean;
    response: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    error: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  success: z.boolean(),
  response: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
});
export type ControlResponse = z.infer<typeof controlResponseSchema>;

export const clientMessageSchema: z.ZodObject<
  { name: z.ZodString; payload: z.ZodRecord<z.ZodString, z.ZodUnknown> },
  z.core.$strip
> = z.object({
  name: z.string(),
  payload: z.record(z.string(), z.unknown()),
});
export const messageContentSchema: z.ZodObject<
  { content: z.ZodArray<z.ZodObject<{ type: z.ZodString; text: z.ZodString }, z.core.$strip>> },
  z.core.$strip
> = z.object({
  content: z.array(z.object({ type: z.string(), text: z.string() })),
});

export const channelIdPayloadSchema: z.ZodObject<{ channelId: z.ZodString }, z.core.$strip> =
  z.object({ channelId: z.string() });
export type ChannelIdPayload = z.infer<typeof channelIdPayloadSchema>;

export const cancelRequestPayloadSchema: z.ZodObject<
  { targetRequestId: z.ZodString },
  z.core.$strip
> = z.object({ targetRequestId: z.string() });
export type CancelRequestPayload = z.infer<typeof cancelRequestPayloadSchema>;

export const channelMetaCacheSchema: z.ZodObject<
  {
    model: z.ZodOptional<z.ZodString>;
    tools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    permissionMode: z.ZodOptional<z.ZodString>;
    slashCommands: z.ZodOptional<z.ZodArray<z.ZodString>>;
    fastModeState: z.ZodOptional<z.ZodUnknown>;
    mcpServers: z.ZodOptional<
      z.ZodArray<z.ZodObject<{ name: z.ZodString; status: z.ZodString }, z.core.$strip>>
    >;
  },
  z.core.$strip
> = z.object({
  model: z.string().optional(),
  tools: z.array(z.string()).optional(),
  permissionMode: z.string().optional(),
  slashCommands: z.array(z.string()).optional(),
  fastModeState: z.unknown().optional(),
  mcpServers: z.array(z.object({ name: z.string(), status: z.string() })).optional(),
});
export type ChannelMetaCache = z.infer<typeof channelMetaCacheSchema>;

// ── Error (moved from notification.ts) ──

export const errorMessagePayloadSchema: z.ZodObject<
  { channelId: z.ZodString; message: z.ZodString; kind: z.ZodOptional<z.ZodString> },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  message: z.string(),
  kind: z.string().optional(),
});
export type ErrorMessagePayload = z.infer<typeof errorMessagePayloadSchema>;

// ── Speech (moved from notification.ts) ──

export const speechToTextMessagePayloadSchema: z.ZodObject<
  { channelId: z.ZodString; text: z.ZodString; done: z.ZodBoolean },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  text: z.string(),
  done: z.boolean(),
});
export type SpeechToTextMessagePayload = z.infer<typeof speechToTextMessagePayloadSchema>;

// sessionSummarySchema — moved to session.ts
// sessionListResponseSchema — moved to session.ts
