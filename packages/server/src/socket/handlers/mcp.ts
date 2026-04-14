import {
  channelIdPayloadSchema,
  mcpAuthenticatePayloadSchema,
  mcpGetServersPayloadSchema,
  mcpMessagePayloadSchema,
  mcpOAuthCallbackPayloadSchema,
  mcpPayloadSchema,
  mcpReconnectPayloadSchema,
  mcpSetEnabledPayloadSchema,
  mcpSetServersPayloadSchema,
} from '@code-quest/shared';
import type { z } from 'zod';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { withChannel, withError } from '../channel-emitter.ts';
import { jsonRpcError, MCP_MESSAGE_TIMEOUT } from '../schemas.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';
import { err, ok } from '../utils/rpc.ts';

/** Factory for simple parse → sendRequest → callback handlers. */
function createRequestHandler<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  event: string,
  errorMessage: string,
  mapParsed?: (parsed: z.infer<T>) => Record<string, unknown>,
) {
  return async function handler(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    cb?: SocketCallback,
  ): Promise<void> {
    try {
      const parsed = schema.parse(payload);
      const requestPayload = mapParsed ? mapParsed(parsed) : parsed;
      const result = await ch.sendRequest(event, requestPayload);
      cb?.(result);
    } catch (e) {
      cb?.({ success: false, error: errMsg(e, errorMessage) });
    }
  };
}

export function create({ emitter }: Pick<HandlerContext, 'emitter'>): void {
  const handleReconnect = createRequestHandler(
    mcpReconnectPayloadSchema,
    'mcp:reconnect',
    'Failed to reconnect MCP server',
  );

  const handleToggle = createRequestHandler(
    mcpSetEnabledPayloadSchema,
    'mcp:toggle',
    'Failed to set MCP server enabled',
  );

  const handleServers = createRequestHandler(
    mcpGetServersPayloadSchema,
    'mcp:servers',
    'Failed to get MCP servers',
  );

  const handleSetServers = createRequestHandler(
    mcpSetServersPayloadSchema,
    'mcp:set_servers',
    'Failed to set MCP servers',
  );

  const handleMessage = createRequestHandler(
    mcpMessagePayloadSchema,
    'mcp:message',
    'Failed to send MCP message',
  );

  async function handleAuthenticate(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    cb?: SocketCallback,
  ): Promise<void> {
    try {
      const { serverName } = mcpAuthenticatePayloadSchema.parse(payload);
      const result = await ch.sendRequest('mcp:authenticate', { serverName });
      if (result.success) {
        cb?.(ok({ authUrl: String(result.response?.authUrl ?? '') || undefined }));
      } else {
        cb?.(err(result.error ?? 'Authentication failed'));
      }
    } catch (e) {
      cb?.(err(errMsg(e, 'Invalid payload')));
    }
  }

  async function handleClearAuth(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    cb?: SocketCallback,
  ): Promise<void> {
    try {
      const { serverName } = mcpAuthenticatePayloadSchema.parse(payload);
      const result = await ch.sendRequest('mcp:clear_auth', { serverName });
      if (result.success) {
        cb?.(ok({}));
      } else {
        cb?.(err(result.error ?? 'Clear auth failed'));
      }
    } catch (e) {
      cb?.(err(errMsg(e, 'Invalid payload')));
    }
  }

  async function handleOAuthCallback(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    cb?: SocketCallback,
  ): Promise<void> {
    try {
      const { serverName, callbackUrl } = mcpOAuthCallbackPayloadSchema.parse(payload);
      const result = await ch.sendRequest('mcp:oauth_callback', { serverName, callbackUrl });
      if (result.success) {
        cb?.(ok({}));
      } else {
        cb?.(err(result.error ?? 'OAuth callback failed'));
      }
    } catch (e) {
      cb?.(err(errMsg(e, 'Invalid payload')));
    }
  }

  function handleAskDebugger(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    cb?: SocketCallback,
  ): void {
    try {
      channelIdPayloadSchema.parse(payload);
      cb?.(ok({ response: { type: 'ask_debugger_help_response' as const } }));
    } catch (e) {
      cb?.(err(errMsg(e, 'Invalid payload')));
    }
  }

  function onMcpControl(ch: Channel, payload: unknown): void {
    const { requestId, message: mcpMsg } = mcpPayloadSchema.parse(payload);
    const hasClient = emitter.getSocketCount(ch.channelId) > 0;
    const mcpId = mcpMsg?.id;
    if (!hasClient) {
      ch.respondToRequest(requestId, jsonRpcError(mcpId, 'no client'));
      return;
    }
    const mcpTimeout = setTimeout(() => {
      ch.removeControlRequest(requestId);
      ch.respondToRequest(requestId, jsonRpcError(mcpId, 'timeout'));
    }, MCP_MESSAGE_TIMEOUT);
    ch.trackControlRequest(requestId, { subtype: 'mcp_message' });
    ch.setMcpTimeout(requestId, mcpTimeout);
  }

  emitter.on('mcp:reconnect', withError(withChannel(handleReconnect)));
  emitter.on('mcp:toggle', withError(withChannel(handleToggle)));
  emitter.on('mcp:servers', withError(withChannel(handleServers)));
  emitter.on('mcp:set_servers', withError(withChannel(handleSetServers)));
  emitter.on('mcp:message', withError(withChannel(handleMessage)));
  emitter.on('mcp:authenticate', withError(withChannel(handleAuthenticate)));
  emitter.on('mcp:clear_auth', withError(withChannel(handleClearAuth)));
  emitter.on('mcp:oauth_callback', withError(withChannel(handleOAuthCallback)));
  emitter.on('mcp:ask_debugger', handleAskDebugger);
  emitter.on('control:mcp', withChannel(onMcpControl));
}
