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

const sessionStateSchema = z.object({
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
  parentId: z.string().optional(),
});
export type SessionState = z.infer<typeof sessionStateSchema>;

/** Extract config fields from session:init into SessionState. */
export const sessionInitConfigSchema = sessionStateSchema.pick({
  model: true,
  permissionMode: true,
  cwd: true,
  effort: true,
});

const requestMetaSchema = z.object({
  subtype: z.string(),
  toolName: z.string().optional(),
  toolUseId: z.string().optional(),
});
export type RequestMeta = z.infer<typeof requestMetaSchema>;

/** Default max thinking tokens when thinking is enabled (matches CLI default). */
export const DEFAULT_THINKING_TOKENS = 31999;

export type SessionBroadcastState = 'launching' | 'busy' | 'idle' | 'exited' | 'disconnected';

/** Validates raw stdout JSON has a `type` field — gate before adapter.transform(). */
export const typedJsonObjectSchema = z.looseObject({ type: z.string() });

/** Validates stdin user message format for history replay. */
export const userMessageInputSchema = z.looseObject({
  type: z.literal('user'),
  message: z.looseObject({ content: z.array(z.unknown()) }),
});
