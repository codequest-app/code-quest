import { z } from 'zod';

// ── Shared response schemas ──

export const successResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type SuccessResponse = z.infer<typeof successResponseSchema>;

export const controlResponseSchema = z.object({
  success: z.boolean(),
  response: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
});
export type ControlResponse = z.infer<typeof controlResponseSchema>;

export const socketEventSchema = z.object({
  name: z.string(),
  payload: z.record(z.string(), z.unknown()),
});
export type SocketEvent = z.infer<typeof socketEventSchema>;

export const messageContentSchema = z.object({
  content: z.array(z.object({ type: z.string(), text: z.string() })),
});
export type MessageContent = z.infer<typeof messageContentSchema>;

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

export const sessionSummarySchema = z.object({
  id: z.string(),
  provider: z.string(),
  command: z.string(),
  args: z.string(),
  cwd: z.string().optional(),
  mode: z.string(),
  role: z.string(),
  parentId: z.string().optional(),
  title: z.string().optional(),
  createdAt: z.string(),
  isActive: z.boolean().optional(),
  lastAssistantMessage: z.string().optional(),
  firstUserMessage: z.string().optional(),
});
export type SessionSummary = z.infer<typeof sessionSummarySchema>;

export const sessionListResponseSchema = z.object({
  sessions: z.array(sessionSummarySchema),
  total: z.number(),
});
export type SessionListResponse = z.infer<typeof sessionListResponseSchema>;
