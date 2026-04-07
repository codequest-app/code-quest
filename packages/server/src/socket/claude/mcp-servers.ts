import { channelIdPayloadSchema } from '@code-quest/shared';
import type { Channel } from '../channel.ts';
import type { ChannelEmitter } from '../channel-emitter.ts';
import type { ChannelManager } from '../channel-manager.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';
import { claudeState, type McpStateKey, type McpStateMap, setMcpState } from './state.ts';

interface McpAction<K extends McpStateKey = McpStateKey> {
  servers: Record<string, { command: string; args: string[] }>;
  stateKey: K;
  beforeRequest?: () => Record<string, unknown>;
  successState: McpStateMap[K];
  successResponse: Record<string, unknown>;
  errorState?: McpStateMap[K];
  connectingState?: McpStateMap[K];
  errorLabel: string;
}

function createMcpHandler(
  channelManager: ChannelManager,
  emitter: ChannelEmitter,
  action: McpAction,
) {
  return async (
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> => {
    try {
      const { channelId } = channelIdPayloadSchema.parse(payload);
      const channel = channelManager.get(channelId) ?? channelManager.getFirstAlive();
      if (!channel) {
        callback?.({ success: false, error: 'No active session' });
        return;
      }

      const extra = action.beforeRequest?.() ?? {};

      if (action.connectingState) {
        setMcpState(action.stateKey, action.connectingState);
        emitter.broadcastAll('settings:update', {
          channelId: '',
          [action.stateKey]: action.connectingState,
        });
      }

      await channel.sendRequest('mcp:set_servers', action.servers);

      setMcpState(action.stateKey, action.successState);
      emitter.broadcastAll('settings:update', {
        channelId: '',
        [action.stateKey]: action.successState,
      });
      callback?.({ success: true, response: { ...action.successResponse, ...extra } });
    } catch (err) {
      if (action.errorState) {
        setMcpState(action.stateKey, action.errorState);
        emitter.broadcastAll('settings:update', {
          channelId: '',
          [action.stateKey]: action.errorState,
        });
      }
      callback?.({ success: false, error: errMsg(err, action.errorLabel) });
    }
  };
}

export function create(channelManager: ChannelManager, emitter: ChannelEmitter): void {
  emitter.on(
    'mcp:ensure_chrome',
    createMcpHandler(channelManager, emitter, {
      servers: { 'claude-in-chrome': { command: 'claude', args: ['mcp', 'serve', 'chrome'] } },
      stateKey: 'chromeMcpState',
      beforeRequest: () => ({ wasDisabled: claudeState.chromeMcpState.status !== 'connected' }),
      connectingState: { status: 'connecting' },
      successState: { status: 'connected' },
      successResponse: { type: 'ensure_chrome_mcp_enabled_response' },
      errorState: { status: 'disconnected' },
      errorLabel: 'Failed to enable Chrome MCP',
    }),
  );

  emitter.on(
    'mcp:disable_chrome',
    createMcpHandler(channelManager, emitter, {
      servers: {},
      stateKey: 'chromeMcpState',
      beforeRequest: () => ({ wasEnabled: claudeState.chromeMcpState.status === 'connected' }),
      successState: { status: 'disconnected' },
      successResponse: { type: 'disable_chrome_mcp_response' },
      errorLabel: 'Failed to disable Chrome MCP',
    }),
  );

  emitter.on(
    'mcp:enable_jupyter',
    createMcpHandler(channelManager, emitter, {
      servers: { 'claude-jupyter': { command: 'claude', args: ['mcp', 'serve', 'jupyter'] } },
      stateKey: 'jupyterMcpState',
      successState: { status: 'active' },
      successResponse: { type: 'enable_jupyter_mcp_response' },
      errorState: { status: 'inactive' },
      errorLabel: 'Failed to enable Jupyter MCP',
    }),
  );

  emitter.on(
    'mcp:disable_jupyter',
    createMcpHandler(channelManager, emitter, {
      servers: {},
      stateKey: 'jupyterMcpState',
      successState: { status: 'inactive' },
      successResponse: { type: 'disable_jupyter_mcp_response' },
      errorLabel: 'Failed to disable Jupyter MCP',
    }),
  );
}
