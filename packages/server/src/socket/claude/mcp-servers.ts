import { chromeMcpControlSchema, jupyterMcpControlSchema } from '@code-quest/shared';
import type { ChannelManager } from '../channel-manager.ts';
import type { SocketHandler, TypedSocket } from '../types.ts';
import { errMsg } from '../types.ts';
import { claudeState } from './state.ts';

export function create(channelManager: ChannelManager): SocketHandler {
  async function handleEnsureChrome(payload: unknown, callback: Function): Promise<void> {
    try {
      const { channelId } = chromeMcpControlSchema.parse(payload);
      const channel = channelManager.get(channelId) ?? channelManager.getFirstAlive();
      if (!channel) {
        callback({ success: false, error: 'No active session' });
        return;
      }
      const wasDisabled = claudeState.chromeMcpState.status !== 'connected';
      claudeState.chromeMcpState = { status: 'connecting' };
      channelManager.broadcastSettingsUpdate('', { chromeMcpState: { status: 'connecting' } });

      await channel.sendControlRequest('mcp_set_servers', {
        'claude-in-chrome': { command: 'claude', args: ['mcp', 'serve', 'chrome'] },
      });

      claudeState.chromeMcpState = { status: 'connected' };
      channelManager.broadcastSettingsUpdate('', { chromeMcpState: { status: 'connected' } });
      callback({
        success: true,
        response: { type: 'ensure_chrome_mcp_enabled_response', wasDisabled },
      });
    } catch (err) {
      claudeState.chromeMcpState = { status: 'disconnected' };
      channelManager.broadcastSettingsUpdate('', {
        chromeMcpState: claudeState.chromeMcpState,
      });
      callback({ success: false, error: errMsg(err, 'Failed to enable Chrome MCP') });
    }
  }

  async function handleDisableChrome(payload: unknown, callback: Function): Promise<void> {
    try {
      const { channelId } = chromeMcpControlSchema.parse(payload);
      const channel = channelManager.get(channelId) ?? channelManager.getFirstAlive();
      if (!channel) {
        callback({ success: false, error: 'No active session' });
        return;
      }
      const wasEnabled = claudeState.chromeMcpState.status === 'connected';
      await channel.sendControlRequest('mcp_set_servers', {});
      claudeState.chromeMcpState = { status: 'disconnected' };
      channelManager.broadcastSettingsUpdate('', {
        chromeMcpState: { status: 'disconnected' },
      });
      callback({ success: true, response: { type: 'disable_chrome_mcp_response', wasEnabled } });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to disable Chrome MCP') });
    }
  }

  async function handleEnableJupyter(payload: unknown, callback: Function): Promise<void> {
    try {
      const { channelId } = jupyterMcpControlSchema.parse(payload);
      const channel = channelManager.get(channelId) ?? channelManager.getFirstAlive();
      if (!channel) {
        callback({ success: false, error: 'No active session' });
        return;
      }
      await channel.sendControlRequest('mcp_set_servers', {
        'claude-jupyter': { command: 'claude', args: ['mcp', 'serve', 'jupyter'] },
      });
      channelManager.broadcastSettingsUpdate('', { jupyterMcpState: { status: 'active' } });
      callback({ success: true, response: { type: 'enable_jupyter_mcp_response' } });
    } catch (err) {
      channelManager.broadcastSettingsUpdate('', { jupyterMcpState: { status: 'inactive' } });
      callback({ success: false, error: errMsg(err, 'Failed to enable Jupyter MCP') });
    }
  }

  async function handleDisableJupyter(payload: unknown, callback: Function): Promise<void> {
    try {
      const { channelId } = jupyterMcpControlSchema.parse(payload);
      const channel = channelManager.get(channelId) ?? channelManager.getFirstAlive();
      if (!channel) {
        callback({ success: false, error: 'No active session' });
        return;
      }
      await channel.sendControlRequest('mcp_set_servers', {});
      channelManager.broadcastSettingsUpdate('', { jupyterMcpState: { status: 'inactive' } });
      callback({ success: true, response: { type: 'disable_jupyter_mcp_response' } });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to disable Jupyter MCP') });
    }
  }

  return {
    register(socket: TypedSocket) {
      socket.on('mcp:ensure_chrome', handleEnsureChrome);
      socket.on('mcp:disable_chrome', handleDisableChrome);
      socket.on('mcp:enable_jupyter', handleEnableJupyter);
      socket.on('mcp:disable_jupyter', handleDisableJupyter);
    },
  };
}
