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
import type { ChannelEventRouter } from '../channel-event-router.ts';
import type { ChannelManager } from '../channel-manager.ts';
import { jsonRpcError, MCP_MESSAGE_TIMEOUT } from '../schemas.ts';
import type { SocketCallback, SocketHandler, TypedSocket } from '../types.ts';
import { errMsg } from '../types.ts';

export function create(channelManager: ChannelManager): SocketHandler {
  function ensureChannel(
    channelId: string,
    callback?: (res: { error: string }) => void,
  ): Channel | null {
    const channel = channelManager.get(channelId);
    if (!channel) {
      callback?.({ error: 'Session not found' });
      return null;
    }
    return channel;
  }

  async function handleReconnect(payload: unknown, callback: SocketCallback): Promise<void> {
    try {
      const { channelId, serverName } = mcpReconnectSchema.parse(payload);
      const channel = ensureChannel(channelId, (e) => callback({ success: false, ...e }));
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_reconnect', {
        server_name: serverName,
      });
      callback(result);
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to reconnect MCP server') });
    }
  }

  async function handleToggle(payload: unknown, callback: SocketCallback): Promise<void> {
    try {
      const { channelId, serverName, enabled } = mcpSetEnabledSchema.parse(payload);
      const channel = ensureChannel(channelId, (e) => callback({ success: false, ...e }));
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_toggle', {
        server_name: serverName,
        enabled,
      });
      callback(result);
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to set MCP server enabled') });
    }
  }

  async function handleServers(payload: unknown, callback: SocketCallback): Promise<void> {
    try {
      const { channelId } = mcpGetServersSchema.parse(payload);
      const channel = ensureChannel(channelId, (e) => callback({ success: false, ...e }));
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_status', {});
      callback(result);
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to get MCP servers') });
    }
  }

  async function handleSetServers(payload: unknown, callback: SocketCallback): Promise<void> {
    try {
      const { channelId, servers } = mcpSetServersSchema.parse(payload);
      const channel = ensureChannel(channelId, (e) => callback({ success: false, ...e }));
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_set_servers', { servers });
      callback(result);
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to set MCP servers') });
    }
  }

  async function handleMessage(payload: unknown, callback: SocketCallback): Promise<void> {
    try {
      const { channelId, serverName, message } = mcpMessageSchema.parse(payload);
      const channel = ensureChannel(channelId, (e) => callback({ success: false, ...e }));
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_message', {
        server_name: serverName,
        message,
      });
      callback(result);
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to send MCP message') });
    }
  }

  async function handleAuthenticate(payload: unknown, callback: SocketCallback): Promise<void> {
    try {
      const { channelId, serverName } = mcpAuthenticateSchema.parse(payload);
      const channel = ensureChannel(channelId, (e) => callback({ success: false, ...e }));
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
  }

  async function handleClearAuth(payload: unknown, callback: SocketCallback): Promise<void> {
    try {
      const { channelId, serverName } = mcpAuthenticateSchema.parse(payload);
      const channel = ensureChannel(channelId, (e) => callback({ success: false, ...e }));
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
  }

  async function handleOAuthCallback(payload: unknown, callback: SocketCallback): Promise<void> {
    try {
      const { channelId, serverName, callbackUrl } = mcpOAuthCallbackSchema.parse(payload);
      const channel = ensureChannel(channelId, (e) => callback({ success: false, ...e }));
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_oauth_callback_url', {
        server_name: serverName,
        callback_url: callbackUrl,
      });
      callback({ success: result.success, error: result.error });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  }

  function handleAskDebugger(payload: unknown, callback: SocketCallback): void {
    try {
      debuggerHelpSchema.parse(payload);
      callback({ success: true, response: { type: 'ask_debugger_help_response' } });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  }

  function onMcpControlEvent(_channelId: string, ch: Channel, se: SocketEvent): void {
    const { requestId, message: mcpMsg } = mcpPayloadSchema.parse(se.payload);
    const hasClient = ch.sockets.size > 0;
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
    ch.mcpTimeouts.set(requestId, mcpTimeout);
  }

  return {
    register(socket: TypedSocket) {
      socket.on('mcp:reconnect', handleReconnect);
      socket.on('mcp:toggle', handleToggle);
      socket.on('mcp:servers', handleServers);
      socket.on('mcp:set_servers', handleSetServers);
      socket.on('mcp:message', handleMessage);
      socket.on('mcp:authenticate', handleAuthenticate);
      socket.on('mcp:clear_auth', handleClearAuth);
      socket.on('mcp:oauth_callback', handleOAuthCallback);
      socket.on('mcp:ask_debugger', handleAskDebugger);
    },
    subscribe(router: ChannelEventRouter) {
      router.onEvent('control:mcp', onMcpControlEvent);
    },
  };
}
