import { z } from 'zod';

/** Timeout for MCP JSON-RPC message relay (ms). */
export const MCP_MESSAGE_TIMEOUT = 10_000;

export function jsonRpcError(id: unknown, message: string): Record<string, unknown> {
  return { jsonrpc: '2.0', error: { code: -32603, message }, id: id ?? null };
}

const requestMetaSchema = z.object({
  subtype: z.string(),
  toolName: z.string().optional(),
  toolUseId: z.string().optional(),
});
export type RequestMeta = z.infer<typeof requestMetaSchema>;

/** Default max thinking tokens when thinking is enabled (matches CLI default). */
export const DEFAULT_THINKING_TOKENS = 31999;

/** Validates raw stdout JSON has a `type` field — gate before adapter.transform(). */
export const typedJsonObjectSchema = z.looseObject({ type: z.string() });

/** Validates stdin user message format for history replay. */
export const userMessageInputSchema = z.looseObject({
  type: z.literal('user'),
  message: z.looseObject({ content: z.array(z.unknown()) }),
});
