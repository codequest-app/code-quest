import {
  chromeMcpControlSchema,
  debuggerHelpSchema,
  jupyterMcpControlSchema,
  mcpAuthenticateSchema,
  mcpGetServersSchema,
  mcpMessageSchema,
  mcpOAuthCallbackSchema,
  mcpReconnectSchema,
  mcpSetEnabledSchema,
  mcpSetServersSchema,
} from '@code-quest/shared';
import type { HandlerContext, TypedSocket } from '../handler-context.ts';
import { ensureChannel, errMsg } from '../handler-context.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on('reconnect_mcp_server', async (payload, callback) => {
    try {
      const { channelId, serverName } = mcpReconnectSchema.parse(payload);
      const channel = ensureChannel(ctx, channelId, callback as never);
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_reconnect', {
        server_name: serverName,
      });
      callback(result);
    } catch (err) {
      callback({ error: errMsg(err, 'Failed to reconnect MCP server') } as never);
    }
  });

  socket.on('set_mcp_server_enabled', async (payload, callback) => {
    try {
      const { channelId, serverName, enabled } = mcpSetEnabledSchema.parse(payload);
      const channel = ensureChannel(ctx, channelId, callback as never);
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_toggle', {
        server_name: serverName,
        enabled,
      });
      callback(result);
    } catch (err) {
      callback({ error: errMsg(err, 'Failed to set MCP server enabled') } as never);
    }
  });

  socket.on('get_mcp_servers', async (payload, callback) => {
    try {
      const { channelId } = mcpGetServersSchema.parse(payload);
      const channel = ensureChannel(ctx, channelId, callback as never);
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_status', {});
      callback(result);
    } catch (err) {
      callback({ error: errMsg(err, 'Failed to get MCP servers') } as never);
    }
  });

  socket.on('mcp_set_servers', async (payload, callback) => {
    try {
      const { channelId, servers } = mcpSetServersSchema.parse(payload);
      const channel = ensureChannel(ctx, channelId, callback as never);
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_set_servers', { servers });
      callback(result);
    } catch (err) {
      callback({ error: errMsg(err, 'Failed to set MCP servers') } as never);
    }
  });

  socket.on('mcp_message', async (payload, callback) => {
    try {
      const { channelId, serverName, message } = mcpMessageSchema.parse(payload);
      const channel = ensureChannel(ctx, channelId, callback as never);
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_message', {
        server_name: serverName,
        message,
      });
      callback(result);
    } catch (err) {
      callback({ error: errMsg(err, 'Failed to send MCP message') } as never);
    }
  });

  socket.on('authenticate_mcp_server', async (payload, callback) => {
    try {
      const { channelId, serverName } = mcpAuthenticateSchema.parse(payload);
      const channel = ensureChannel(ctx, channelId, (e) => callback({ success: false, ...e }));
      if (!channel) return;
      const result = await channel.sendControlRequest('mcp_authenticate', {
        server_name: serverName,
      });
      if (result.success) {
        callback({ success: true, authUrl: result.response?.authUrl as string | undefined });
      } else {
        callback({ success: false, error: result.error ?? 'Authentication failed' });
      }
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  });

  socket.on('clear_mcp_server_auth', async (payload, callback) => {
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

  socket.on('submit_mcp_oauth_callback_url', async (payload, callback) => {
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

  socket.on('ensure_chrome_mcp_enabled', (payload, callback) => {
    try {
      chromeMcpControlSchema.parse(payload);
      const wasDisabled = ctx.chromeMcpState.status !== 'connected';
      if (wasDisabled) {
        ctx.chromeMcpState = { status: 'connecting' };
        ctx.io?.emit('state:update', { channelId: '', chromeMcpState: { status: 'connecting' } });
        ctx.chromeMcpState = { status: 'connected' };
        ctx.io?.emit('state:update', { channelId: '', chromeMcpState: { status: 'connected' } });
      }
      callback({
        success: true,
        response: { type: 'ensure_chrome_mcp_enabled_response', wasDisabled },
      });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  });

  socket.on('disable_chrome_mcp', (payload, callback) => {
    try {
      chromeMcpControlSchema.parse(payload);
      const wasEnabled = ctx.chromeMcpState.status === 'connected';
      ctx.chromeMcpState = { status: 'disconnected' };
      ctx.io?.emit('state:update', { channelId: '', chromeMcpState: { status: 'disconnected' } });
      callback({ success: true, response: { type: 'disable_chrome_mcp_response', wasEnabled } });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  });

  socket.on('enable_jupyter_mcp', (payload, callback) => {
    try {
      jupyterMcpControlSchema.parse(payload);
      ctx.io?.emit('state:update', { channelId: '', jupyterMcpState: { status: 'active' } });
      callback({ success: true, response: { type: 'enable_jupyter_mcp_response' } });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  });

  socket.on('disable_jupyter_mcp', (payload, callback) => {
    try {
      jupyterMcpControlSchema.parse(payload);
      ctx.io?.emit('state:update', { channelId: '', jupyterMcpState: { status: 'inactive' } });
      callback({ success: true, response: { type: 'disable_jupyter_mcp_response' } });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  });

  socket.on('ask_debugger_help', (payload, callback) => {
    try {
      debuggerHelpSchema.parse(payload);
      callback({ success: true, response: { type: 'ask_debugger_help_response' } });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  });
}
