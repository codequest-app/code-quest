import type { SocketCallback, TypedSocket } from '@code-quest/schemas';
import {
  controlAuthenticateResponseSchema,
  EVENTS,
  errMsg,
  loginPayloadSchema,
  oauthCodePayloadSchema,
} from '@code-quest/schemas';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { BROADCAST_CHANNEL_ID } from '../channel-emitter.ts';
import { err, ok } from '../utils/rpc.ts';
import { claudeState, setAuthState } from './state.ts';

export function create({
  channelManager,
  emitter,
}: Pick<HandlerContext, 'channelManager' | 'emitter'>): void {
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
        callback?.(err('No active session. Please open a tab first.'));
        return;
      }
      const { method } = loginPayloadSchema.parse(payload);
      const controlResp = await channel.sendRequest('auth:authenticate', {
        loginWithClaudeAi: method !== 'api_key',
      });
      const authData = controlAuthenticateResponseSchema.parse(controlResp.response);
      if (authData.manualUrl || authData.automaticUrl) {
        socket?.emit(EVENTS.notification.auth_url, {
          channelId: BROADCAST_CHANNEL_ID,
          url: authData.automaticUrl ?? authData.manualUrl ?? '',
          method: 'browser',
        });
      }
      callback?.(ok({ auth: authData }));
    } catch (e) {
      logger.error({ err: e }, 'Login failed');
      callback?.(err(errMsg(e, 'Login failed')));
    }
  }

  async function handleOAuthCode(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { code, state } = oauthCodePayloadSchema.parse(payload);
      const channel = channelManager.getFirstAlive();
      if (!channel) {
        callback?.(err('No active session'));
        return;
      }
      await channel.sendRequest('auth:oauth_callback', {
        authorizationCode: code,
        state,
      });
      await channel.sendRequest('auth:oauth_wait');
      setAuthState({
        authenticated: true,
        user: { name: 'authenticated' },
        method: 'oauth',
      });
      callback?.(ok({}));
    } catch (e) {
      logger.error({ err: e }, 'OAuth failed');
      callback?.(err(errMsg(e, 'OAuth failed')));
    }
  }

  emitter.on(EVENTS.auth.status, handleStatus);
  emitter.on(EVENTS.auth.login, handleLogin);
  emitter.on(EVENTS.auth.oauth_code, handleOAuthCode);
}
