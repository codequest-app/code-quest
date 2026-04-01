import { z } from 'zod';

/** Timeout for MCP JSON-RPC message relay (ms). */
export const MCP_MESSAGE_TIMEOUT = 10_000;

export function jsonRpcError(id: unknown, message: string): Record<string, unknown> {
  return { jsonrpc: '2.0', error: { code: -32603, message }, id: id ?? null };
}

export const errorMessageEventSchema = z.looseObject({ message: z.string() });

export const sessionInitEventSchema = z.looseObject({
  sessionId: z.string().optional(),
  config: z.record(z.string(), z.unknown()).nullable().optional(),
  model: z.string().optional(),
  permissionMode: z.string().optional(),
  tools: z.array(z.string()).optional(),
  fastModeState: z.unknown().optional(),
  mcpServers: z.array(z.looseObject({ name: z.string(), status: z.string() })).optional(),
  slashCommands: z.array(z.string()).optional(),
});

export const sessionStatusEventSchema = z.looseObject({
  permissionMode: z.string().optional(),
});

export const controlRequestEventSchema = z.looseObject({ requestId: z.string() });

export const sessionStateSchema = z.object({
  model: z.string().optional(),
  permissionMode: z.string().optional(),
  cwd: z.string().optional(),
  effort: z.string().optional(),
  thinkingLevel: z.string().optional(),
  tools: z.array(z.string()).optional(),
  mcpServers: z.array(z.object({ name: z.string(), status: z.string() })).optional(),
  titleGenerated: z.boolean().optional(),
  pendingTitlePrompt: z.string().optional(),
  title: z.string().optional(),
});
export type SessionState = z.infer<typeof sessionStateSchema>;

/** Extract config fields from session:init into SessionState. */
export const sessionInitConfigSchema = sessionStateSchema.pick({
  model: true,
  permissionMode: true,
  cwd: true,
  effort: true,
});

export const requestMetaSchema = z.object({
  subtype: z.string(),
  toolName: z.string().optional(),
  toolUseId: z.string().optional(),
});
export type RequestMeta = z.infer<typeof requestMetaSchema>;

export const channelSummarySchema = z.object({
  channelId: z.string(),
  state: z.enum(['busy', 'idle', 'exited']),
  title: z.string().optional(),
  model: z.string().optional(),
});
export type ChannelSummary = z.infer<typeof channelSummarySchema>;

export const initResponseResultSchema = z.object({
  slashCommands: z.array(z.string()).optional(),
  models: z.array(z.unknown()).optional(),
  account: z.record(z.string(), z.unknown()).optional(),
});
export type InitResponseResult = z.infer<typeof initResponseResultSchema>;

/** Validates raw stdout JSON has a `type` field — gate before adapter.transform(). */
export const typedJsonObjectSchema = z.looseObject({ type: z.string() });

/** Validates stdin user message format for history replay. */
export const userMessageInputSchema = z.looseObject({
  type: z.literal('user'),
  message: z.looseObject({ content: z.array(z.unknown()) }),
});
