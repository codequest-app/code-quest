import { z } from 'zod';

export const streamChunkSchema: z.ZodObject<
  {
    kind: z.ZodEnum<{
      text: 'text';
      thinking: 'thinking';
      input_json: 'input_json';
      citations: 'citations';
      signature: 'signature';
    }>;
    content: z.ZodString;
    citations: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
  },
  z.core.$strip
> = z.object({
  kind: z.enum(['text', 'thinking', 'input_json', 'citations', 'signature']),
  content: z.string(),
  citations: z.array(z.unknown()).optional(),
});
export type StreamChunk = z.infer<typeof streamChunkSchema>;

const channelIdBase = z.object({ channelId: z.string() });

export const streamChunkPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    chunk: z.ZodObject<
      {
        kind: z.ZodEnum<{
          text: 'text';
          thinking: 'thinking';
          input_json: 'input_json';
          citations: 'citations';
          signature: 'signature';
        }>;
        content: z.ZodString;
        citations: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
      },
      z.core.$strip
    >;
    parentToolUseId: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = channelIdBase.extend({
  chunk: streamChunkSchema,
  parentToolUseId: z.string().optional(),
});
export type StreamChunkPayload = z.infer<typeof streamChunkPayloadSchema>;

export const streamEndPayloadSchema: z.ZodObject<{ channelId: z.ZodString }, z.core.$strip> =
  channelIdBase;
export type StreamEndPayload = z.infer<typeof streamEndPayloadSchema>;

export const streamTextPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; text: z.ZodString },
  z.core.$strip
> = channelIdBase.extend({
  text: z.string(),
});
export type StreamTextPayload = z.infer<typeof streamTextPayloadSchema>;

export const streamToolSummaryPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; toolSummary: z.ZodString },
  z.core.$strip
> = channelIdBase.extend({
  toolSummary: z.string(),
});
export type StreamToolSummaryPayload = z.infer<typeof streamToolSummaryPayloadSchema>;

export const streamBlockStartPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    index: z.ZodNumber;
    blockType: z.ZodString;
    contentBlock: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    parentToolUseId: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = channelIdBase.extend({
  index: z.number(),
  blockType: z.string(),
  contentBlock: z.record(z.string(), z.unknown()).optional(),
  parentToolUseId: z.string().optional(),
});
export type StreamBlockStartPayload = z.infer<typeof streamBlockStartPayloadSchema>;
