import { z } from 'zod';

export const streamChunkSchema = z.object({
  kind: z.enum(['text', 'thinking', 'input_json', 'citations', 'signature']),
  content: z.string(),
  citations: z.array(z.unknown()).optional(),
});
export type StreamChunk = z.infer<typeof streamChunkSchema>;

const channelIdBase = z.object({ channelId: z.string() });

export const streamChunkPayloadSchema = channelIdBase.extend({
  chunk: streamChunkSchema,
  parentToolUseId: z.string().optional(),
});
export type StreamChunkPayload = z.infer<typeof streamChunkPayloadSchema>;

export const streamEndPayloadSchema = channelIdBase;
export type StreamEndPayload = z.infer<typeof streamEndPayloadSchema>;

export const streamTextPayloadSchema = channelIdBase.extend({
  text: z.string(),
});
export type StreamTextPayload = z.infer<typeof streamTextPayloadSchema>;

export const streamToolSummaryPayloadSchema = channelIdBase.extend({
  toolSummary: z.string(),
});
export type StreamToolSummaryPayload = z.infer<typeof streamToolSummaryPayloadSchema>;

export const streamBlockStartPayloadSchema = channelIdBase.extend({
  index: z.number(),
  blockType: z.string(),
  contentBlock: z.record(z.string(), z.unknown()).optional(),
  parentToolUseId: z.string().optional(),
});
export type StreamBlockStartPayload = z.infer<typeof streamBlockStartPayloadSchema>;
