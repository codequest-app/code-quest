import {
  planClosePreviewSchema,
  planCommentSchema,
  planGetCommentsSchema,
  planRemoveCommentSchema,
} from '@code-quest/shared';
import type { HandlerContext } from '../context.ts';
import type { SocketHandler, TypedSocket } from '../types.ts';
import { errMsg } from '../types.ts';

export function create(ctx: HandlerContext): SocketHandler {
  function addComment(socket: TypedSocket, payload: unknown, callback: Function): void {
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
  }

  function getComments(payload: unknown, callback: Function): void {
    try {
      const { channelId } = planGetCommentsSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      callback({ comments: channel?.planComments ?? [] });
    } catch {
      callback({ comments: [] });
    }
  }

  function removeComment(socket: TypedSocket, payload: unknown, callback: Function): void {
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
  }

  function closePreview(payload: unknown, callback: Function): void {
    try {
      const { channelId } = planClosePreviewSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (channel) channel.planComments = [];
      callback({ success: true });
    } catch {
      callback({ success: true });
    }
  }

  return {
    register(socket: TypedSocket) {
      socket.on('plan:comment', (p, cb) => addComment(socket, p, cb));
      socket.on('plan:comments', (p, cb) => getComments(p, cb));
      socket.on('plan:remove_comment', (p, cb) => removeComment(socket, p, cb));
      socket.on('plan:close_preview', (p, cb) => closePreview(p, cb));
    },
  };
}
