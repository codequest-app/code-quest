import {
  debuggerHelpSchema,
  mcpAuthenticateSchema,
  mcpGetServersSchema,
  mcpMessageSchema,
  mcpOAuthCallbackSchema,
  mcpPayloadSchema,
  mcpReconnectSchema,
  mcpSetEnabledSchema,
  mcpSetServersSchema,
} from '@code-quest/shared';
import type { Channel } from '../channel.ts';
import { type ChannelEmitter, withChannel, withError } from '../channel-emitter.ts';
import { jsonRpcError, MCP_MESSAGE_TIMEOUT } from '../schemas.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';

export function create(emitter: ChannelEmitter): void {
  async function handleReconnect(ch: Channel, payload: unknown, _socket?: TypedSocket, cb?: SocketCallback): Promise<void> {
    try {
      const { serverName } = mcpReconnectSchema.parse(payload);
      const result = await ch.sendControlRequest('mcp_reconnect', { server_name: serverName });
      cb?.(result);
    } catch (err) {
      cb?.({ success: false, error: errMsg(err, 'Failed to reconnect MCP server') });
    }
  }

  async function handleToggle(ch: Channel, payload: unknown, _socket?: TypedSocket, cb?: SocketCallback): Promise<void> {
    try {
      const { serverName, enabled } = mcpSetEnabledSchema.parse(payload);
      const result = await ch.sendControlRequest('mcp_toggle', { server_name: serverName, enabled });
      cb?.(result);
    } catch (err) {
      cb?.({ success: false, error: errMsg(err, 'Failed to set MCP server enabled') });
    }
  }

  async function handleServers(ch: Channel, payload: unknown, _socket?: TypedSocket, cb?: SocketCallback): Promise<void> {
    try {
      mcpGetServersSchema.parse(payload);
      const result = await ch.sendControlRequest('mcp_status', {});
      cb?.(result);
    } catch (err) {
      cb?.({ success: false, error: errMsg(err, 'Failed to get MCP servers') });
    }
  }

  async function handleSetServers(ch: Channel, payload: unknown, _socket?: TypedSocket, cb?: SocketCallback): Promise<void> {
    try {
      const { servers } = mcpSetServersSchema.parse(payload);
      const result = await ch.sendControlRequest('mcp_set_servers', { servers });
      cb?.(result);
    } catch (err) {
      cb?.({ success: false, error: errMsg(err, 'Failed to set MCP servers') });
    }
  }

  async function handleMessage(ch: Channel, payload: unknown, _socket?: TypedSocket, cb?: SocketCallback): Promise<void> {
    try {
      const { serverName, message } = mcpMessageSchema.parse(payload);
      const result = await ch.sendControlRequest('mcp_message', { server_name: serverName, message });
      cb?.(result);
    } catch (err) {
      cb?.({ success: false, error: errMsg(err, 'Failed to send MCP message') });
    }
  }

  async function handleAuthenticate(ch: Channel, payload: unknown, _socket?: TypedSocket, cb?: SocketCallback): Promise<void> {
    try {
      const { serverName } = mcpAuthenticateSchema.parse(payload);
      const result = await ch.sendControlRequest('mcp_authenticate', { server_name: serverName });
      if (result.success) {
        cb?.({ success: true, authUrl: String(result.response?.authUrl ?? '') || undefined });
      } else {
        cb?.({ success: false, error: result.error ?? 'Authentication failed' });
      }
    } catch (err) {
      cb?.({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  }

  async function handleClearAuth(ch: Channel, payload: unknown, _socket?: TypedSocket, cb?: SocketCallback): Promise<void> {
    try {
      const { serverName } = mcpAuthenticateSchema.parse(payload);
      const result = await ch.sendControlRequest('mcp_clear_auth', { server_name: serverName });
      cb?.({ success: result.success, error: result.success ? undefined : (result.error ?? 'Clear auth failed') });
    } catch (err) {
      cb?.({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  }

  async function handleOAuthCallback(ch: Channel, payload: unknown, _socket?: TypedSocket, cb?: SocketCallback): Promise<void> {
    try {
      const { serverName, callbackUrl } = mcpOAuthCallbackSchema.parse(payload);
      const result = await ch.sendControlRequest('mcp_oauth_callback_url', { server_name: serverName, callback_url: callbackUrl });
      cb?.({ success: result.success, error: result.error });
    } catch (err) {
      cb?.({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  }

  function handleAskDebugger(_ch: Channel | null, payload: unknown, _socket?: TypedSocket, cb?: SocketCallback): void {
    try {
      debuggerHelpSchema.parse(payload);
      cb?.({ success: true, response: { type: 'ask_debugger_help_response' } });
    } catch (err) {
      cb?.({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  }

  function onMcpControlEvent(ch: Channel, payload: unknown): void {
    const { requestId, message: mcpMsg } = mcpPayloadSchema.parse(payload);
    const hasClient = emitter.getSocketCount(ch.id) > 0;
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
  emitter.on('control:mcp', withChannel(onMcpControlEvent));
}
