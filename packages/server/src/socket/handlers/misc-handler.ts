import {
  planClosePreviewSchema,
  planCommentSchema,
  planGetCommentsSchema,
  planRemoveCommentSchema,
} from '@code-quest/shared';
import type { HandlerContext, TypedSocket } from '../handler-context.ts';
import { errMsg } from '../handler-context.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on('get_auth_status', (callback) => {
    callback(ctx.authState);
  });

  socket.on('login', (payload, callback) => {
    ctx.authState = {
      authenticated: true,
      user: { name: payload.method === 'api_key' ? 'api-key-user' : 'unknown' },
      method: payload.method,
    };
    callback?.({
      success: true,
      auth: {
        authenticated: true,
        user: ctx.authState?.user,
        method: payload.method,
      },
    });
  });

  socket.on('submit_oauth_code', (_payload, callback) => {
    ctx.authState = {
      authenticated: true,
      user: { name: 'oauth-user' },
      method: 'oauth',
    };
    callback({ success: true });
  });

  socket.on('init', (callback) => {
    const sessions = ctx.channelManager.getAliveChannels().map((ch) => ({
      channelId: ch.channelId,
      state: ch.state,
      title: ch.title,
      modelSetting: ch.model,
    }));
    callback({
      settings: ctx.settingsStore.getAll(),
      sessions,
      models: ctx.cachedModels,
      state: {
        platform: process.platform,
        speechToTextEnabled: false,
        browserIntegrationSupported: false,
      },
    });
  });

  socket.on('comment', (payload, callback) => {
    try {
      const { channelId, comment } = planCommentSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (channel) {
        channel.planComments.push(comment);
      }
      callback({ success: true });
      channel?.emitToOthers(socket, 'plan_comment', { channelId, comment });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to add comment') });
    }
  });

  socket.on('get_plan_comments', (payload, callback) => {
    try {
      const { channelId } = planGetCommentsSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      callback({ comments: channel?.planComments ?? [] });
    } catch {
      callback({ comments: [] });
    }
  });

  socket.on('remove_plan_comment', (payload, callback) => {
    try {
      const { channelId, commentId } = planRemoveCommentSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      const comments = channel?.planComments;
      if (!comments) {
        callback({ success: false, error: 'Comment not found' });
        return;
      }
      const idx = comments.findIndex((c) => c.id === commentId);
      if (idx === -1) {
        callback({ success: false, error: 'Comment not found' });
        return;
      }
      comments.splice(idx, 1);
      callback({ success: true });
      channel?.emitToOthers(socket, 'removeComment', { channelId, commentId });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to remove comment') });
    }
  });

  socket.on('close_plan_preview', (payload, callback) => {
    try {
      const { channelId } = planClosePreviewSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (channel) channel.planComments = [];
      callback({ success: true });
    } catch {
      callback({ success: true });
    }
  });

  // ── Speech-to-Text socket handlers ──
  socket.on('start_speech_to_text', (payload) => {
    console.log('start_speech_to_text', (payload as { channelId?: string }).channelId);
  });

  socket.on('stop_speech_to_text', (payload) => {
    console.log('stop_speech_to_text', (payload as { channelId?: string }).channelId);
  });

  socket.on('disconnect', () => {
    const channelIds = ctx.socketChannelsMap.get(socket.id);
    if (!channelIds) return;

    for (const channelId of channelIds) {
      const channel = ctx.channelManager.get(channelId);
      if (!channel) continue;

      channel.removeSocket(socket);

      if (channel.sockets.size === 0) {
        channel.unwireRunner();
      }
    }

    ctx.socketChannelsMap.delete(socket.id);
  });
}
