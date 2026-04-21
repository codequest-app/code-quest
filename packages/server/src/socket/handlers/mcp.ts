import {
  channelIdPayloadSchema,
  EVENTS,
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

interface RequestHandlerOpts<T extends z.ZodObject<z.ZodRawShape>> {
  schema: T;
  event: string;
  errorMessage: string;
  mapParsed?: (parsed: z.infer<T>) => Record<string, unknown>;
  /** If provided, success → `ok(mapSuccess(response))`; failure → `err(error ?? failureMessage)`. */
  mapSuccess?: (response: Record<string, unknown> | undefined) => Record<string, unknown>;
  failureMessage?: string;
}

function createRequestHandler<T extends z.ZodObject<z.ZodRawShape>>(opts: RequestHandlerOpts<T>) {
  const { schema, event, errorMessage, mapParsed, mapSuccess, failureMessage } = opts;
  const wrapThrown = mapSuccess
    ? (e: unknown) => err(errMsg(e, errorMessage))
    : (e: unknown) => ({ success: false as const, error: errMsg(e, errorMessage) });

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
      if (!mapSuccess) {
        cb?.(result);
        return;
      }
      cb?.(
        result.success
          ? ok(mapSuccess(result.response))
          : err(result.error ?? failureMessage ?? errorMessage),
      );
    } catch (e) {
      cb?.(wrapThrown(e));
    }
  };
}

export function create({ emitter }: Pick<HandlerContext, 'emitter'>): void {
  const handleReconnect = createRequestHandler({
    schema: mcpReconnectPayloadSchema,
    event: EVENTS.mcp.reconnect,
    errorMessage: 'Failed to reconnect MCP server',
  });

  const handleToggle = createRequestHandler({
    schema: mcpSetEnabledPayloadSchema,
    event: EVENTS.mcp.toggle,
    errorMessage: 'Failed to set MCP server enabled',
  });

  const handleServers = createRequestHandler({
    schema: mcpGetServersPayloadSchema,
    event: EVENTS.mcp.servers,
    errorMessage: 'Failed to get MCP servers',
  });

  const handleSetServers = createRequestHandler({
    schema: mcpSetServersPayloadSchema,
    event: EVENTS.mcp.set_servers,
    errorMessage: 'Failed to set MCP servers',
  });

  const handleMessage = createRequestHandler({
    schema: mcpMessagePayloadSchema,
    event: EVENTS.mcp.message,
    errorMessage: 'Failed to send MCP message',
  });

  const handleAuthenticate = createRequestHandler({
    schema: mcpAuthenticatePayloadSchema,
    event: EVENTS.mcp.authenticate,
    errorMessage: 'Invalid payload',
    failureMessage: 'Authentication failed',
    mapSuccess: (response) => ({
      authUrl: String(response?.authUrl ?? '') || undefined,
    }),
  });

  const handleClearAuth = createRequestHandler({
    schema: mcpAuthenticatePayloadSchema,
    event: EVENTS.mcp.clear_auth,
    errorMessage: 'Invalid payload',
    failureMessage: 'Clear auth failed',
    mapSuccess: () => ({}),
  });

  const handleOAuthCallback = createRequestHandler({
    schema: mcpOAuthCallbackPayloadSchema,
    event: EVENTS.mcp.oauth_callback,
    errorMessage: 'Invalid payload',
    failureMessage: 'OAuth callback failed',
    mapSuccess: () => ({}),
  });

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

  emitter.on(EVENTS.mcp.reconnect, withError(withChannel(handleReconnect)));
  emitter.on(EVENTS.mcp.toggle, withError(withChannel(handleToggle)));
  emitter.on(EVENTS.mcp.servers, withError(withChannel(handleServers)));
  emitter.on(EVENTS.mcp.set_servers, withError(withChannel(handleSetServers)));
  emitter.on(EVENTS.mcp.message, withError(withChannel(handleMessage)));
  emitter.on(EVENTS.mcp.authenticate, withError(withChannel(handleAuthenticate)));
  emitter.on(EVENTS.mcp.clear_auth, withError(withChannel(handleClearAuth)));
  emitter.on(EVENTS.mcp.oauth_callback, withError(withChannel(handleOAuthCallback)));
  emitter.on(EVENTS.mcp.ask_debugger, handleAskDebugger);
  emitter.on(EVENTS.control.mcp, withChannel(onMcpControl));
}
