import { z } from 'zod';

const mcpChannelServerSchema = z.object({
  channelId: z.string(),
  serverName: z.string(),
});

export const mcpReconnectPayloadSchema = mcpChannelServerSchema;
export type McpReconnectPayload = z.infer<typeof mcpReconnectPayloadSchema>;

export const mcpSetEnabledPayloadSchema = mcpChannelServerSchema.extend({
  enabled: z.boolean(),
});
export type McpSetEnabledPayload = z.infer<typeof mcpSetEnabledPayloadSchema>;

export const mcpGetServersPayloadSchema = z.object({
  channelId: z.string(),
});
export type McpGetServersPayload = z.infer<typeof mcpGetServersPayloadSchema>;

export const mcpSetServersPayloadSchema = z.object({
  channelId: z.string(),
  servers: z.record(z.string(), z.unknown()),
});
export type McpSetServersPayload = z.infer<typeof mcpSetServersPayloadSchema>;

export const mcpMessagePayloadSchema = mcpChannelServerSchema.extend({
  message: z.record(z.string(), z.unknown()),
});
export type McpMessagePayload = z.infer<typeof mcpMessagePayloadSchema>;

export const mcpAuthenticatePayloadSchema = mcpChannelServerSchema;
export type McpAuthenticatePayload = z.infer<typeof mcpAuthenticatePayloadSchema>;

export const mcpOAuthCallbackPayloadSchema = mcpChannelServerSchema.extend({
  callbackUrl: z.string().url(),
});
export type McpOAuthCallbackPayload = z.infer<typeof mcpOAuthCallbackPayloadSchema>;

export const mcpAuthResultSchema = z.object({
  success: z.boolean(),
  authUrl: z.string().optional(),
  error: z.string().optional(),
});
export type McpAuthResult = z.infer<typeof mcpAuthResultSchema>;

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
