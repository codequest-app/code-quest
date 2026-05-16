import { z } from 'zod';

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

export const errorMessagePayloadSchema: z.ZodObject<
  { channelId: z.ZodString; message: z.ZodString; kind: z.ZodOptional<z.ZodString> },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  message: z.string(),
  kind: z.string().optional(),
});
export type ErrorMessagePayload = z.infer<typeof errorMessagePayloadSchema>;

export const speechToTextMessagePayloadSchema: z.ZodObject<
  { channelId: z.ZodString; text: z.ZodString; done: z.ZodBoolean },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  text: z.string(),
  done: z.boolean(),
});
export type SpeechToTextMessagePayload = z.infer<typeof speechToTextMessagePayloadSchema>;
