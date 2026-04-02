import {
  type PlanCommentData,
  planClosePreviewSchema,
  planCommentSchema,
  planGetCommentsSchema,
  planRemoveCommentSchema,
} from '@code-quest/shared';
import type { ChannelEmitter } from '../channel-emitter.ts';
import type { SocketCallback, SocketHandler, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';

export interface PlanApi {
  consumeCommentsAsUserFeedback(channelId: string): string | undefined;
}

export function create(emitter: ChannelEmitter): SocketHandler & PlanApi {
  const commentsMap = new Map<string, PlanCommentData[]>();

  function getOrCreate(channelId: string): PlanCommentData[] {
    let list = commentsMap.get(channelId);
    if (!list) {
      list = [];
      commentsMap.set(channelId, list);
    }
    return list;
  }

  function addComment(socket: TypedSocket, payload: unknown, callback: SocketCallback): void {
    try {
      const { channelId, comment } = planCommentSchema.parse(payload);
      getOrCreate(channelId).push(comment);
      callback({ success: true });
      emitter.emitToOthers(channelId, socket.id, 'plan:comment_added', { channelId, comment });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to add comment') });
    }
  }

  function getComments(payload: unknown, callback: SocketCallback): void {
    try {
      const { channelId } = planGetCommentsSchema.parse(payload);
      callback({ comments: commentsMap.get(channelId) ?? [] });
    } catch {
      callback({ comments: [] });
    }
  }

  function removeComment(socket: TypedSocket, payload: unknown, callback: SocketCallback): void {
    try {
      const { channelId, commentId } = planRemoveCommentSchema.parse(payload);
      const comments = commentsMap.get(channelId);
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
      emitter.emitToOthers(channelId, socket.id, 'plan:comment_removed', { channelId, commentId });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to remove comment') });
    }
  }

  function closePreview(payload: unknown, callback: SocketCallback): void {
    try {
      const { channelId } = planClosePreviewSchema.parse(payload);
      commentsMap.delete(channelId);
      callback({ success: true });
    } catch {
      callback({ success: true });
    }
  }

  function consumeCommentsAsUserFeedback(channelId: string): string | undefined {
    const list = commentsMap.get(channelId);
    if (!list?.length) return undefined;
    const feedback = list.map((c) => `[Re: "${c.selectedText}"] ${c.comment}`).join('\n');
    commentsMap.delete(channelId);
    return feedback;
  }

  return {
    register(socket: TypedSocket) {
      socket.on('plan:comment', (p, cb) => addComment(socket, p, cb));
      socket.on('plan:comments', (p, cb) => getComments(p, cb));
      socket.on('plan:remove_comment', (p, cb) => removeComment(socket, p, cb));
      socket.on('plan:close_preview', (p, cb) => closePreview(p, cb));
    },
    consumeCommentsAsUserFeedback,
  };
}
