import { z } from 'zod';

export const mcpReconnectSchema = z.object({
  channelId: z.string(),
  serverName: z.string(),
});
export type McpReconnectPayload = z.infer<typeof mcpReconnectSchema>;

export const mcpSetEnabledSchema = z.object({
  channelId: z.string(),
  serverName: z.string(),
  enabled: z.boolean(),
});
export type McpSetEnabledPayload = z.infer<typeof mcpSetEnabledSchema>;

export const mcpGetServersSchema = z.object({
  channelId: z.string(),
});
export type McpGetServersPayload = z.infer<typeof mcpGetServersSchema>;

export const mcpSetServersSchema = z.object({
  channelId: z.string(),
  servers: z.record(z.string(), z.unknown()),
});
export type McpSetServersPayload = z.infer<typeof mcpSetServersSchema>;

export const mcpMessageSchema = z.object({
  channelId: z.string(),
  serverName: z.string(),
  message: z.record(z.string(), z.unknown()),
});
export type McpMessagePayload = z.infer<typeof mcpMessageSchema>;

export const mcpAuthenticateSchema = z.object({ channelId: z.string(), serverName: z.string() });
export type McpAuthenticatePayload = z.infer<typeof mcpAuthenticateSchema>;

export const mcpOAuthCallbackSchema = z.object({
  channelId: z.string(),
  serverName: z.string(),
  callbackUrl: z.string().url(),
});
export type McpOAuthCallbackPayload = z.infer<typeof mcpOAuthCallbackSchema>;

export const mcpAuthResultSchema = z.object({
  success: z.boolean(),
  authUrl: z.string().optional(),
  error: z.string().optional(),
});
export type McpAuthResult = z.infer<typeof mcpAuthResultSchema>;

export type {
  ChannelIdPayload as ChromeMcpControlPayload,
  ChannelIdPayload as JupyterMcpControlPayload,
  ChannelIdPayload as DebuggerHelpPayload,
} from './common.ts';
// These are all {channelId} — re-export channelIdPayloadSchema as aliases
export {
  channelIdPayloadSchema as chromeMcpControlSchema,
  channelIdPayloadSchema as jupyterMcpControlSchema,
  channelIdPayloadSchema as debuggerHelpSchema,
} from './common.ts';

// ── Response schemas ──

export const ensureChromeMcpResponseSchema = z.looseObject({
  success: z.boolean(),
  response: z
    .object({ type: z.literal('ensure_chrome_mcp_enabled_response'), wasDisabled: z.boolean() })
    .optional(),
  error: z.string().optional(),
});
export type EnsureChromeMcpResponse = z.infer<typeof ensureChromeMcpResponseSchema>;

export const disableChromeMcpResponseSchema = z.looseObject({
  success: z.boolean(),
  response: z
    .object({ type: z.literal('disable_chrome_mcp_response'), wasEnabled: z.boolean() })
    .optional(),
  error: z.string().optional(),
});
export type DisableChromeMcpResponse = z.infer<typeof disableChromeMcpResponseSchema>;

export const enableJupyterMcpResponseSchema = z.looseObject({
  success: z.boolean(),
  response: z.object({ type: z.literal('enable_jupyter_mcp_response') }).optional(),
  error: z.string().optional(),
});
export type EnableJupyterMcpResponse = z.infer<typeof enableJupyterMcpResponseSchema>;

export const disableJupyterMcpResponseSchema = z.looseObject({
  success: z.boolean(),
  response: z.object({ type: z.literal('disable_jupyter_mcp_response') }).optional(),
  error: z.string().optional(),
});
export type DisableJupyterMcpResponse = z.infer<typeof disableJupyterMcpResponseSchema>;

export const askDebuggerHelpResponseSchema = z.looseObject({
  success: z.boolean(),
  response: z.object({ type: z.literal('ask_debugger_help_response') }).optional(),
  error: z.string().optional(),
});
export type AskDebuggerHelpResponse = z.infer<typeof askDebuggerHelpResponseSchema>;

/** control:mcp payload (runner → server handler) */
export const mcpPayloadSchema = z.looseObject({
  requestId: z.string(),
  message: z.record(z.string(), z.unknown()).optional(),
});
export type McpPayload = z.infer<typeof mcpPayloadSchema>;

// ── MCP server info (used by client UI) ──

export const mcpToolSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});
export type McpTool = z.infer<typeof mcpToolSchema>;

export const mcpServerInfoSchema = z.object({
  name: z.string(),
  enabled: z.boolean(),
  status: z.enum([
    'connected',
    'disconnected',
    'error',
    'failed',
    'needs-auth',
    'disabled',
    'connecting',
  ]),
  scope: z.string().optional(),
});
export type McpServerInfo = z.infer<typeof mcpServerInfoSchema>;
