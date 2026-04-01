import { chromeMcpControlSchema, jupyterMcpControlSchema } from '@code-quest/shared';
import type { HandlerContext } from '../context.ts';
import type { TypedSocket } from '../types.ts';
import { errMsg } from '../types.ts';
import { claudeState } from './state.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on('mcp:ensure_chrome', async (payload, callback) => {
    try {
      const { channelId } = chromeMcpControlSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId) ?? ctx.channelManager.getFirstAlive();
      if (!channel) {
        callback({ success: false, error: 'No active session' });
        return;
      }
      const wasDisabled = claudeState.chromeMcpState.status !== 'connected';
      claudeState.chromeMcpState = { status: 'connecting' };
      ctx.io?.emit('settings:update', { channelId: '', chromeMcpState: { status: 'connecting' } });

      await channel.sendControlRequest('mcp_set_servers', {
        'claude-in-chrome': { command: 'claude', args: ['mcp', 'serve', 'chrome'] },
      });

      claudeState.chromeMcpState = { status: 'connected' };
      ctx.io?.emit('settings:update', { channelId: '', chromeMcpState: { status: 'connected' } });
      callback({
        success: true,
        response: { type: 'ensure_chrome_mcp_enabled_response', wasDisabled },
      });
    } catch (err) {
      claudeState.chromeMcpState = { status: 'disconnected' };
      ctx.io?.emit('settings:update', {
        channelId: '',
        chromeMcpState: claudeState.chromeMcpState,
      });
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
      const wasEnabled = claudeState.chromeMcpState.status === 'connected';

      await channel.sendControlRequest('mcp_set_servers', {});

      claudeState.chromeMcpState = { status: 'disconnected' };
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
}
