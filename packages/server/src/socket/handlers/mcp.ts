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
  type SocketEvent,
} from '@code-quest/shared';
import type { Channel } from '../channel.ts';
import type { HandlerContext } from '../context.ts';
import { jsonRpcError, MCP_MESSAGE_TIMEOUT } from '../schemas.ts';
import type { TypedSocket } from '../types.ts';
import { ensureChannel, errMsg } from '../types.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on('mcp:reconnect', async (payload, callback) => {
    try {
      const { channelId, serverName } = mcpReconnectSchema.parse(payload);
      const channel = ensureChannel(ctx, channelId, (e) => callback({ success: false, ...e }));
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_reconnect', {
        server_name: serverName,
      });
      callback(result);
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to reconnect MCP server') });
    }
  });

  socket.on('mcp:toggle', async (payload, callback) => {
    try {
      const { channelId, serverName, enabled } = mcpSetEnabledSchema.parse(payload);
      const channel = ensureChannel(ctx, channelId, (e) => callback({ success: false, ...e }));
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_toggle', {
        server_name: serverName,
        enabled,
      });
      callback(result);
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to set MCP server enabled') });
    }
  });

  socket.on('mcp:servers', async (payload, callback) => {
    try {
      const { channelId } = mcpGetServersSchema.parse(payload);
      const channel = ensureChannel(ctx, channelId, (e) => callback({ success: false, ...e }));
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_status', {});
      callback(result);
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to get MCP servers') });
    }
  });

  socket.on('mcp:set_servers', async (payload, callback) => {
    try {
      const { channelId, servers } = mcpSetServersSchema.parse(payload);
      const channel = ensureChannel(ctx, channelId, (e) => callback({ success: false, ...e }));
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_set_servers', { servers });
      callback(result);
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to set MCP servers') });
    }
  });

  socket.on('mcp:message', async (payload, callback) => {
    try {
      const { channelId, serverName, message } = mcpMessageSchema.parse(payload);
      const channel = ensureChannel(ctx, channelId, (e) => callback({ success: false, ...e }));
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_message', {
        server_name: serverName,
        message,
      });
      callback(result);
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to send MCP message') });
    }
  });

  socket.on('mcp:authenticate', async (payload, callback) => {
    try {
      const { channelId, serverName } = mcpAuthenticateSchema.parse(payload);
      const channel = ensureChannel(ctx, channelId, (e) => callback({ success: false, ...e }));
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_authenticate', {
        server_name: serverName,
      });
      if (result.success) {
        callback({ success: true, authUrl: String(result.response?.authUrl ?? '') || undefined });
      } else {
        callback({ success: false, error: result.error ?? 'Authentication failed' });
      }
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  });

  socket.on('mcp:clear_auth', async (payload, callback) => {
    try {
      const { channelId, serverName } = mcpAuthenticateSchema.parse(payload);
      const channel = ensureChannel(ctx, channelId, (e) => callback({ success: false, ...e }));
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_clear_auth', {
        server_name: serverName,
      });
      if (result.success) {
        callback({ success: true });
      } else {
        callback({ success: false, error: result.error ?? 'Clear auth failed' });
      }
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  });

  socket.on('mcp:oauth_callback', async (payload, callback) => {
    try {
      const { channelId, serverName, callbackUrl } = mcpOAuthCallbackSchema.parse(payload);
      const channel = ensureChannel(ctx, channelId, (e) => callback({ success: false, ...e }));
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_oauth_callback_url', {
        server_name: serverName,
        callback_url: callbackUrl,
      });
      callback({ success: result.success, error: result.error });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  });

  // Debugger: extension also returns empty response — no CLI action needed
  socket.on('mcp:ask_debugger', (payload, callback) => {
    try {
      debuggerHelpSchema.parse(payload);
      callback({ success: true, response: { type: 'ask_debugger_help_response' } });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  });
}

export function onRunnerEvent(
  _ctx: HandlerContext,
  _channelId: string,
  ch: Channel,
  se: SocketEvent,
): boolean {
  if (se.name !== 'control:mcp') return false;
  const { requestId, message: mcpMsg } = mcpPayloadSchema.parse(se.payload);
  const hasClient = ch.sockets.size > 0;
  const mcpId = mcpMsg?.id;
  if (!hasClient) {
    ch.respondToRequest(requestId, jsonRpcError(mcpId, 'no client'));
    return true;
  }
  const mcpTimeout = setTimeout(() => {
    ch.removeControlRequest(requestId);
    ch.respondToRequest(requestId, jsonRpcError(mcpId, 'timeout'));
  }, MCP_MESSAGE_TIMEOUT);
  ch.trackControlRequest(requestId, { subtype: 'mcp_message' });
  ch.mcpTimeouts.set(requestId, mcpTimeout);
  return true;
}
