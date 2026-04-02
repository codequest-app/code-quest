import { chromeMcpControlSchema, jupyterMcpControlSchema } from '@code-quest/shared';
import type { Channel } from '../channel.ts';
import type { ChannelEmitter } from '../channel-emitter.ts';
import type { ChannelManager } from '../channel-manager.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';
import { claudeState } from './state.ts';

export function create(channelManager: ChannelManager, emitter: ChannelEmitter): void {
  async function handleEnsureChrome(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { channelId } = chromeMcpControlSchema.parse(payload);
      const channel = channelManager.get(channelId) ?? channelManager.getFirstAlive();
      if (!channel) {
        callback?.({ success: false, error: 'No active session' });
        return;
      }
      const wasDisabled = claudeState.chromeMcpState.status !== 'connected';
      claudeState.chromeMcpState = { status: 'connecting' };
      emitter.broadcastAll('settings:update', { channelId: '', chromeMcpState: { status: 'connecting' } });

      await channel.sendControlRequest('mcp_set_servers', {
        'claude-in-chrome': { command: 'claude', args: ['mcp', 'serve', 'chrome'] },
      });

      claudeState.chromeMcpState = { status: 'connected' };
      emitter.broadcastAll('settings:update', { channelId: '', chromeMcpState: { status: 'connected' } });
      callback?.({
        success: true,
        response: { type: 'ensure_chrome_mcp_enabled_response', wasDisabled },
      });
    } catch (err) {
      claudeState.chromeMcpState = { status: 'disconnected' };
      emitter.broadcastAll('settings:update', {
        channelId: '',
        chromeMcpState: claudeState.chromeMcpState,
      });
      callback?.({ success: false, error: errMsg(err, 'Failed to enable Chrome MCP') });
    }
  }

  async function handleDisableChrome(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { channelId } = chromeMcpControlSchema.parse(payload);
      const channel = channelManager.get(channelId) ?? channelManager.getFirstAlive();
      if (!channel) {
        callback?.({ success: false, error: 'No active session' });
        return;
      }
      const wasEnabled = claudeState.chromeMcpState.status === 'connected';
      await channel.sendControlRequest('mcp_set_servers', {});
      claudeState.chromeMcpState = { status: 'disconnected' };
      emitter.broadcastAll('settings:update', {
        channelId: '',
        chromeMcpState: { status: 'disconnected' },
      });
      callback?.({ success: true, response: { type: 'disable_chrome_mcp_response', wasEnabled } });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to disable Chrome MCP') });
    }
  }

  async function handleEnableJupyter(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { channelId } = jupyterMcpControlSchema.parse(payload);
      const channel = channelManager.get(channelId) ?? channelManager.getFirstAlive();
      if (!channel) {
        callback?.({ success: false, error: 'No active session' });
        return;
      }
      await channel.sendControlRequest('mcp_set_servers', {
        'claude-jupyter': { command: 'claude', args: ['mcp', 'serve', 'jupyter'] },
      });
      emitter.broadcastAll('settings:update', { channelId: '', jupyterMcpState: { status: 'active' } });
      callback?.({ success: true, response: { type: 'enable_jupyter_mcp_response' } });
    } catch (err) {
      emitter.broadcastAll('settings:update', { channelId: '', jupyterMcpState: { status: 'inactive' } });
      callback?.({ success: false, error: errMsg(err, 'Failed to enable Jupyter MCP') });
    }
  }

  async function handleDisableJupyter(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { channelId } = jupyterMcpControlSchema.parse(payload);
      const channel = channelManager.get(channelId) ?? channelManager.getFirstAlive();
      if (!channel) {
        callback?.({ success: false, error: 'No active session' });
        return;
      }
      await channel.sendControlRequest('mcp_set_servers', {});
      emitter.broadcastAll('settings:update', { channelId: '', jupyterMcpState: { status: 'inactive' } });
      callback?.({ success: true, response: { type: 'disable_jupyter_mcp_response' } });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to disable Jupyter MCP') });
    }
  }

  emitter.on('mcp:ensure_chrome', handleEnsureChrome);
  emitter.on('mcp:disable_chrome', handleDisableChrome);
  emitter.on('mcp:enable_jupyter', handleEnableJupyter);
  emitter.on('mcp:disable_jupyter', handleDisableJupyter);
}
