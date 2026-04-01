import { controlAuthenticateResponseSchema } from '@code-quest/shared';
import type { ChannelManager } from '../channel-manager.ts';
import type { SocketCallback, SocketHandler, TypedSocket } from '../types.ts';
import { errMsg } from '../types.ts';
import { claudeState } from './state.ts';

export function create(channelManager: ChannelManager): SocketHandler {
  function handleStatus(callback: SocketCallback): void {
    callback(claudeState.authState);
  }

  async function handleLogin(
    socket: TypedSocket,
    payload: { method?: string },
    callback: SocketCallback,
  ): Promise<void> {
    try {
      const channel = channelManager.getFirstAlive();
      if (!channel) {
        callback?.({ success: false, error: 'No active session. Please open a tab first.' });
        return;
      }
      const controlResp = await channel.sendControlRequest('claude_authenticate', {
        loginWithClaudeAi: payload.method !== 'api_key',
      });
      const authData = controlAuthenticateResponseSchema.parse(controlResp.response);
      if (authData.manualUrl || authData.automaticUrl) {
        socket.emit('notification:auth_url', {
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
    payload: { code: string; state?: string },
    callback: SocketCallback,
  ): Promise<void> {
    try {
      const channel = channelManager.getFirstAlive();
      if (!channel) {
        callback({ success: false, error: 'No active session' });
        return;
      }
      await channel.sendControlRequest('claude_oauth_callback', {
        authorizationCode: payload.code,
        state: payload.state,
      });
      await channel.sendControlRequest('claude_oauth_wait_for_completion', {});
      claudeState.authState = {
        authenticated: true,
        user: { name: 'authenticated' },
        method: 'oauth',
      };
      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'OAuth failed') });
    }
  }

  return {
    register(socket: TypedSocket) {
      socket.on('auth:status', handleStatus);
      socket.on('auth:login', (p, cb) => handleLogin(socket, p, cb));
      socket.on('auth:oauth_code', handleOAuthCode);
    },
  };
}
