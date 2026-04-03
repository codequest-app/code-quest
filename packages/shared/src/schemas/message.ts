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

export const chatInterruptSchema = z.object({
  channelId: z.string(),
});
export type ChatInterruptPayload = z.infer<typeof chatInterruptSchema>;

export const chatRewindCodeSchema = z.object({
  channelId: z.string(),
  userMessageId: z.string().optional(),
  dryRun: z.boolean().optional(),
});
export type ChatRewindCodePayload = z.infer<typeof chatRewindCodeSchema>;

export const chatStopTaskSchema = z.object({ channelId: z.string(), taskId: z.string() });
export type ChatStopTaskPayload = z.infer<typeof chatStopTaskSchema>;

// ── Message content blocks ──

export const textBlockSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});
export type TextBlock = z.infer<typeof textBlockSchema>;

export const thinkingBlockSchema = z.object({
  type: z.literal('thinking'),
  thinking: z.string(),
});
export type ThinkingBlock = z.infer<typeof thinkingBlockSchema>;

export const toolUseBlockSchema = z.object({
  type: z.literal('tool_use'),
  toolId: z.string(),
  toolName: z.string(),
  input: z.unknown(),
});
export type ToolUseBlock = z.infer<typeof toolUseBlockSchema>;

export const toolResultBlockSchema = z.object({
  type: z.literal('tool_result'),
  toolUseId: z.string(),
  toolName: z.string().optional(),
  content: z.unknown(),
});
export type ToolResultBlock = z.infer<typeof toolResultBlockSchema>;

export const contentBlockSchema = z.union([
  textBlockSchema,
  thinkingBlockSchema,
  toolUseBlockSchema,
  toolResultBlockSchema,
]);
export type ContentBlock = z.infer<typeof contentBlockSchema>;

// ── Stream chunks ──

export const streamChunkSchema = z.object({
  kind: z.enum(['text', 'thinking', 'input_json', 'citations', 'signature']),
  content: z.string(),
  citations: z.array(z.unknown()).optional(),
});
export type StreamChunk = z.infer<typeof streamChunkSchema>;

// ── Stats ──

export const modelUsageEntrySchema = z.object({
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  cacheReadInputTokens: z.number().optional(),
  cacheCreationInputTokens: z.number().optional(),
  costUSD: z.number().optional(),
  contextWindow: z.number().optional(),
  maxOutputTokens: z.number().optional(),
});
export type ModelUsageEntry = z.infer<typeof modelUsageEntrySchema>;

export const chatStatsSchema = z.object({
  costUsd: z.number().optional(),
  durationMs: z.number().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  numTurns: z.number().optional(),
  modelUsage: z.record(z.string(), modelUsageEntrySchema).optional(),
  contextWindow: z.number().optional(),
});
export type ChatStats = z.infer<typeof chatStatsSchema>;

export const sessionStatsSchema = z.object({
  totalCostUsd: z.number().optional(),
  durationMs: z.number().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  cacheReadInputTokens: z.number().optional(),
  cacheCreationInputTokens: z.number().optional(),
  numTurns: z.number().optional(),
  modelUsage: z.record(z.string(), modelUsageEntrySchema).optional(),
});
export type SessionStats = z.infer<typeof sessionStatsSchema>;

// ── Message meta (per message type) ──

export const toolResultSchema = z.object({
  content: z.string().optional(),
  is_error: z.boolean().optional(),
});
export type ToolResult = z.infer<typeof toolResultSchema>;

export const toolUseMetaSchema = z.object({
  toolId: z.string(),
  input: z.record(z.string(), z.unknown()),
  partialInput: z.string().optional(),
  result: toolResultSchema.optional(),
  fileContent: z.string().optional(),
  fileError: z.string().optional(),
});
export type ToolUseMeta = z.infer<typeof toolUseMetaSchema>;

export const toolResultMetaSchema = z.object({
  toolId: z.string(),
  name: z.string().optional(),
  is_error: z.boolean().optional(),
});
export type ToolResultMeta = z.infer<typeof toolResultMetaSchema>;

export const resultMetaSchema = z.object({
  stats: chatStatsSchema,
});
export type ResultMeta = z.infer<typeof resultMetaSchema>;

// ── S2C payloads ──

export const messageAssistantPayloadSchema = z.object({
  channelId: z.string(),
  content: z.array(contentBlockSchema),
  parentToolUseId: z.string().optional(),
  uuid: z.string().optional(),
});
export type MessageAssistantPayload = z.infer<typeof messageAssistantPayloadSchema>;

export const messageUserPayloadSchema = z.object({
  channelId: z.string(),
  content: z.array(contentBlockSchema),
  parentToolUseId: z.string().optional(),
  uuid: z.string().optional(),
});
export type MessageUserPayload = z.infer<typeof messageUserPayloadSchema>;

export const messageResultPayloadSchema = z.object({
  channelId: z.string(),
  stats: sessionStatsSchema,
  errors: z.array(z.string()).optional(),
  isError: z.boolean().optional(),
  subtype: z.string().optional(),
});
export type MessageResultPayload = z.infer<typeof messageResultPayloadSchema>;

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
