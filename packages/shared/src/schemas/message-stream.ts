import { z } from 'zod';

export const streamChunkSchema = z.object({
  kind: z.enum(['text', 'thinking', 'input_json', 'citations', 'signature']),
  content: z.string(),
  citations: z.array(z.unknown()).optional(),
});
export type StreamChunk = z.infer<typeof streamChunkSchema>;

export const streamChunkPayloadSchema = z.object({
  channelId: z.string(),
  chunk: streamChunkSchema,
  parentToolUseId: z.string().optional(),
});
export type StreamChunkPayload = z.infer<typeof streamChunkPayloadSchema>;

export const streamEndPayloadSchema = z.object({
  channelId: z.string(),
});
export type StreamEndPayload = z.infer<typeof streamEndPayloadSchema>;

export const streamTextPayloadSchema = z.object({
  channelId: z.string(),
  text: z.string(),
});
export type StreamTextPayload = z.infer<typeof streamTextPayloadSchema>;

export const streamToolSummaryPayloadSchema = z.object({
  channelId: z.string(),
  toolSummary: z.string(),
});
export type StreamToolSummaryPayload = z.infer<typeof streamToolSummaryPayloadSchema>;

export const streamBlockStartPayloadSchema = z.object({
  channelId: z.string(),
  index: z.number(),
  blockType: z.string(),
  contentBlock: z.record(z.string(), z.unknown()).optional(),
  parentToolUseId: z.string().optional(),
});
export type StreamBlockStartPayload = z.infer<typeof streamBlockStartPayloadSchema>;
