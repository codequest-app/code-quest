import { z } from 'zod';

/** Timeout for MCP JSON-RPC message relay (ms). */
export const MCP_MESSAGE_TIMEOUT = 10_000;

export function jsonRpcError(id: unknown, message: string): Record<string, unknown> {
  return { jsonrpc: '2.0', error: { code: -32603, message }, id: id ?? null };
}

export const errorPayload = z.object({ message: z.string() }).passthrough();

export const sessionInitPayload = z
  .object({
    sessionId: z.string().optional(),
    config: z.record(z.string(), z.unknown()).nullable().optional(),
    model: z.string().optional(),
    permissionMode: z.string().optional(),
    tools: z.array(z.string()).optional(),
    fastModeState: z.unknown().optional(),
    mcpServers: z
      .array(z.object({ name: z.string(), status: z.string() }).passthrough())
      .optional(),
    slashCommands: z.array(z.string()).optional(),
  })
  .passthrough();

export const sessionStatusPayload = z
  .object({
    permissionMode: z.string().optional(),
  })
  .passthrough();

export const replayRequestPayload = z.object({ requestId: z.string() }).passthrough();

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
