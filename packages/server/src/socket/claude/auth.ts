import { controlAuthenticateResponseSchema } from '@code-quest/shared';
import type { Channel } from '../channel.ts';
import type { ChannelEmitter } from '../channel-emitter.ts';
import type { ChannelManager } from '../channel-manager.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';
import { claudeState } from './state.ts';

export function create(channelManager: ChannelManager, emitter: ChannelEmitter): void {
  function handleStatus(
    _ch: Channel | null,
    _payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    callback?.(claudeState.authState);
  }

  async function handleLogin(
    _ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const channel = channelManager.getFirstAlive();
      if (!channel) {
        callback?.({ success: false, error: 'No active session. Please open a tab first.' });
        return;
      }
      const { method } = payload as { method?: string };
      const controlResp = await channel.sendControlRequest('claude_authenticate', {
        loginWithClaudeAi: method !== 'api_key',
      });
      const authData = controlAuthenticateResponseSchema.parse(controlResp.response);
      if (authData.manualUrl || authData.automaticUrl) {
        socket?.emit('notification:auth_url', {
          channelId: '',
          url: authData.automaticUrl ?? authData.manualUrl ?? '',
          method: 'browser',
        });
      }
      callback?.({ success: true, auth: authData });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Login failed') });
    }
  }

  async function handleOAuthCode(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { code, state } = payload as { code: string; state?: string };
      const channel = channelManager.getFirstAlive();
      if (!channel) {
        callback?.({ success: false, error: 'No active session' });
        return;
      }
      await channel.sendControlRequest('claude_oauth_callback', {
        authorizationCode: code,
        state,
      });
      await channel.sendControlRequest('claude_oauth_wait_for_completion', {});
      claudeState.authState = {
        authenticated: true,
        user: { name: 'authenticated' },
        method: 'oauth',
      };
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'OAuth failed') });
    }
  }

  emitter.on('auth:status', handleStatus);
  emitter.on('auth:login', handleLogin);
  emitter.on('auth:oauth_code', handleOAuthCode);
}
