import {
  planClosePreviewSchema,
  planCommentSchema,
  planGetCommentsSchema,
  planRemoveCommentSchema,
} from '@code-quest/shared';
import type { HandlerContext, TypedSocket } from '../handler-context.ts';
import { errMsg } from '../handler-context.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on('plan:comment', (payload, callback) => {
    try {
      const { channelId, comment } = planCommentSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (channel) {
        channel.planComments.push(comment);
      }
      callback({ success: true });
      channel?.emitToOthers(socket, 'plan:comment_added', { channelId, comment });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to add comment') });
    }
  });

  socket.on('plan:comments', (payload, callback) => {
    try {
      const { channelId } = planGetCommentsSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      callback({ comments: channel?.planComments ?? [] });
    } catch {
      callback({ comments: [] });
    }
  });

  socket.on('plan:remove_comment', (payload, callback) => {
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
      channel?.emitToOthers(socket, 'plan:comment_removed', { channelId, commentId });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to remove comment') });
    }
  });

  socket.on('plan:close_preview', (payload, callback) => {
    try {
      const { channelId } = planClosePreviewSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (channel) channel.planComments = [];
      callback({ success: true });
    } catch {
      callback({ success: true });
    }
  });
}
