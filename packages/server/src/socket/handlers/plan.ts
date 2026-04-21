import {
  channelIdPayloadSchema,
  EVENTS,
  type PlanCommentData,
  planCommentPayloadSchema,
  planRemoveCommentPayloadSchema,
} from '@code-quest/shared';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg } from '../utils/helpers.ts';
import { err, ok } from '../utils/rpc.ts';

export interface PlanApi {
  consumeCommentsAsUserFeedback(channelId: string): string | undefined;
}

export function create({ emitter }: Pick<HandlerContext, 'emitter'>): PlanApi {
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
      cb?.(ok({}));
      if (socket)
        emitter.emitToOthers(channelId, socket.id, EVENTS.plan.comment_added, {
          channelId,
          comment,
        });
    } catch (e) {
      cb?.(err(errMsg(e, 'Failed to add comment')));
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
        cb?.(err('Comment not found'));
        return;
      }
      const idx = comments.findIndex((c) => c.id === commentId);
      if (idx === -1) {
        cb?.(err('Comment not found'));
        return;
      }
      comments.splice(idx, 1);
      cb?.(ok({}));
      if (socket)
        emitter.emitToOthers(channelId, socket.id, EVENTS.plan.comment_removed, {
          channelId,
          commentId,
        });
    } catch (e) {
      cb?.(err(errMsg(e, 'Failed to remove comment')));
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
      cb?.(ok({}));
    } catch (e) {
      cb?.(err(errMsg(e, 'Failed to close preview')));
    }
  }

  function consumeCommentsAsUserFeedback(channelId: string): string | undefined {
    const list = commentsMap.get(channelId);
    if (!list?.length) return undefined;
    const feedback = list.map((c) => `[Re: "${c.selectedText}"] ${c.comment}`).join('\n');
    commentsMap.delete(channelId);
    return feedback;
  }

  emitter.on(EVENTS.plan.comment, addComment);
  emitter.on(EVENTS.plan.comments, getComments);
  emitter.on(EVENTS.plan.remove_comment, removeComment);
  emitter.on(EVENTS.plan.close_preview, closePreview);

  return { consumeCommentsAsUserFeedback };
}
