import {
  channelIdPayloadSchema,
  type PlanCommentData,
  planCommentPayloadSchema,
  planRemoveCommentPayloadSchema,
} from '@code-quest/shared';
import { logger } from '../../logger.ts';
import type { Channel } from '../channel.ts';
import type { ChannelEmitter } from '../channel-emitter.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';

export interface PlanApi {
  consumeCommentsAsUserFeedback(channelId: string): string | undefined;
}

export function create(emitter: ChannelEmitter): PlanApi {
  const commentsMap = new Map<string, PlanCommentData[]>();

  function getOrCreate(channelId: string): PlanCommentData[] {
    let list = commentsMap.get(channelId);
    if (!list) {
      list = [];
      commentsMap.set(channelId, list);
    }
    return list;
  }

  function addComment(
    _ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    cb?: SocketCallback,
  ): void {
    try {
      const { channelId, comment } = planCommentPayloadSchema.parse(payload);
      getOrCreate(channelId).push(comment);
      cb?.({ success: true });
      if (socket)
        emitter.emitToOthers(channelId, socket.id, 'plan:comment_added', { channelId, comment });
    } catch (err) {
      cb?.({ success: false, error: errMsg(err, 'Failed to add comment') });
    }
  }

  function getComments(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    cb?: SocketCallback,
  ): void {
    try {
      const { channelId } = channelIdPayloadSchema.parse(payload);
      cb?.({ comments: commentsMap.get(channelId) ?? [] });
    } catch (err) {
      logger.debug(err, 'failed to get plan comments');
      cb?.({ comments: [] });
    }
  }

  function removeComment(
    _ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    cb?: SocketCallback,
  ): void {
    try {
      const { channelId, commentId } = planRemoveCommentPayloadSchema.parse(payload);
      const comments = commentsMap.get(channelId);
      if (!comments) {
        cb?.({ success: false, error: 'Comment not found' });
        return;
      }
      const idx = comments.findIndex((c) => c.id === commentId);
      if (idx === -1) {
        cb?.({ success: false, error: 'Comment not found' });
        return;
      }
      comments.splice(idx, 1);
      cb?.({ success: true });
      if (socket)
        emitter.emitToOthers(channelId, socket.id, 'plan:comment_removed', {
          channelId,
          commentId,
        });
    } catch (err) {
      cb?.({ success: false, error: errMsg(err, 'Failed to remove comment') });
    }
  }

  function closePreview(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    cb?: SocketCallback,
  ): void {
    try {
      const { channelId } = channelIdPayloadSchema.parse(payload);
      commentsMap.delete(channelId);
      cb?.({ success: true });
    } catch (err) {
      cb?.({ success: false, error: errMsg(err, 'Failed to close preview') });
    }
  }

  function consumeCommentsAsUserFeedback(channelId: string): string | undefined {
    const list = commentsMap.get(channelId);
    if (!list?.length) return undefined;
    const feedback = list.map((c) => `[Re: "${c.selectedText}"] ${c.comment}`).join('\n');
    commentsMap.delete(channelId);
    return feedback;
  }

  emitter.on('plan:comment', addComment);
  emitter.on('plan:comments', getComments);
  emitter.on('plan:remove_comment', removeComment);
  emitter.on('plan:close_preview', closePreview);

  return { consumeCommentsAsUserFeedback };
}
