import { controlAuthenticateResponseSchema } from '@code-quest/shared';
import type { HandlerContext, TypedSocket } from '../handler-context.ts';
import { errMsg } from '../handler-context.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on('auth:status', (callback) => {
    callback(ctx.authState);
  });

  socket.on('auth:login', async (payload, callback) => {
    try {
      const channel = ctx.channelManager.getFirstAlive();
      if (!channel) {
        callback?.({
          success: false,
          error: 'No active session. Please open a tab first.',
        });
        return;
      }
      const controlResp = await channel.sendControlRequest('claude_authenticate', {
        loginWithClaudeAi: payload.method !== 'api_key',
      });
      const parsed = controlAuthenticateResponseSchema.safeParse(controlResp.response);
      const authData = parsed.success ? parsed.data : undefined;
      if (authData?.manualUrl || authData?.automaticUrl) {
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
  });

  socket.on('auth:oauth_code', async (payload, callback) => {
    try {
      const channel = ctx.channelManager.getFirstAlive();
      if (!channel) {
        callback({ success: false, error: 'No active session' });
        return;
      }
      await channel.sendControlRequest('claude_oauth_callback', {
        authorizationCode: payload.code,
        state: payload.state,
      });
      await channel.sendControlRequest('claude_oauth_wait_for_completion', {});
      ctx.authState = {
        authenticated: true,
        user: { name: 'oauth-user' },
        method: 'oauth',
      };
      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'OAuth failed') });
    }
  });
}
