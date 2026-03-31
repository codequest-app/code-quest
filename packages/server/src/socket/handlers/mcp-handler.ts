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

  socket.on('mcp:ensure_chrome', async (payload, callback) => {
    try {
      const { channelId } = chromeMcpControlSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId) ?? ctx.channelManager.getFirstAlive();
      if (!channel) {
        callback({ success: false, error: 'No active session' });
        return;
      }
      const wasDisabled = ctx.chromeMcpState.status !== 'connected';
      ctx.chromeMcpState = { status: 'connecting' };
      ctx.io?.emit('settings:update', { channelId: '', chromeMcpState: { status: 'connecting' } });

      await channel.sendControlRequest('mcp_set_servers', {
        'claude-in-chrome': { command: 'claude', args: ['mcp', 'serve', 'chrome'] },
      });

      ctx.chromeMcpState = { status: 'connected' };
      ctx.io?.emit('settings:update', { channelId: '', chromeMcpState: { status: 'connected' } });
      callback({
        success: true,
        response: { type: 'ensure_chrome_mcp_enabled_response', wasDisabled },
      });
    } catch (err) {
      ctx.chromeMcpState = { status: 'disconnected' };
      ctx.io?.emit('settings:update', { channelId: '', chromeMcpState: ctx.chromeMcpState });
      callback({ success: false, error: errMsg(err, 'Failed to enable Chrome MCP') });
    }
  });

  socket.on('mcp:disable_chrome', async (payload, callback) => {
    try {
      const { channelId } = chromeMcpControlSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId) ?? ctx.channelManager.getFirstAlive();
      if (!channel) {
        callback({ success: false, error: 'No active session' });
        return;
      }
      const wasEnabled = ctx.chromeMcpState.status === 'connected';

      await channel.sendControlRequest('mcp_set_servers', {});

      ctx.chromeMcpState = { status: 'disconnected' };
      ctx.io?.emit('settings:update', {
        channelId: '',
        chromeMcpState: { status: 'disconnected' },
      });
      callback({ success: true, response: { type: 'disable_chrome_mcp_response', wasEnabled } });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to disable Chrome MCP') });
    }
  });

  socket.on('mcp:enable_jupyter', async (payload, callback) => {
    try {
      const { channelId } = jupyterMcpControlSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId) ?? ctx.channelManager.getFirstAlive();
      if (!channel) {
        callback({ success: false, error: 'No active session' });
        return;
      }

      await channel.sendControlRequest('mcp_set_servers', {
        'claude-jupyter': { command: 'claude', args: ['mcp', 'serve', 'jupyter'] },
      });

      ctx.io?.emit('settings:update', { channelId: '', jupyterMcpState: { status: 'active' } });
      callback({ success: true, response: { type: 'enable_jupyter_mcp_response' } });
    } catch (err) {
      ctx.io?.emit('settings:update', {
        channelId: '',
        jupyterMcpState: { status: 'inactive' },
      });
      callback({ success: false, error: errMsg(err, 'Failed to enable Jupyter MCP') });
    }
  });

  socket.on('mcp:disable_jupyter', async (payload, callback) => {
    try {
      const { channelId } = jupyterMcpControlSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId) ?? ctx.channelManager.getFirstAlive();
      if (!channel) {
        callback({ success: false, error: 'No active session' });
        return;
      }

      await channel.sendControlRequest('mcp_set_servers', {});

      ctx.io?.emit('settings:update', { channelId: '', jupyterMcpState: { status: 'inactive' } });
      callback({ success: true, response: { type: 'disable_jupyter_mcp_response' } });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to disable Jupyter MCP') });
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
