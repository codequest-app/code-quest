import {
  ERROR_CODES,
  EVENTS,
  sessionClosePayloadSchema,
  sessionDeletePayloadSchema,
  sessionGenerateTitlePayloadSchema,
  sessionRenamePayloadSchema,
  sessionUpdateStatePayloadSchema,
} from '@code-quest/shared';
import type { SocketCallback, TypedSocket } from '@code-quest/shared/node';
import { errMsg } from '@code-quest/shared/node';
import { logger } from '../../../logger.ts';
import type { HandlerContext } from '../../../types.ts';
import type { Channel } from '../../channel.ts';
import { withChannel } from '../../channel-emitter.ts';
import { err, ok } from '../../utils/rpc.ts';

export function create({
  channelManager,
  sessionStore,
  emitter,
}: Pick<HandlerContext, 'channelManager' | 'sessionStore' | 'emitter'>): void {
  function handleClose(ch: Channel, payload: unknown): void {
    try {
      const { channelId } = sessionClosePayloadSchema.parse(payload);
      ch.kill();
      emitter.broadcastAll(EVENTS.session.dead, { channelId });
    } catch (err) {
      logger.warn({ err }, 'Failed to close session');
    }
  }

  async function handleDelete(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { channelId } = sessionDeletePayloadSchema.parse(payload);
      const success = await sessionStore.deleteByChannelId(channelId);
      if (!success) {
        callback?.(err('Session not found', ERROR_CODES.SESSION_NOT_FOUND));
        return;
      }
      callback?.(ok({}));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to delete session')));
    }
  }

  async function handleRename(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { channelId, title } = sessionRenamePayloadSchema.parse(payload);
      const success = await sessionStore.renameByChannelId(channelId, title);
      if (!success) {
        callback?.(err('Session not found', ERROR_CODES.SESSION_NOT_FOUND));
        return;
      }
      callback?.(ok({}));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to rename session')));
    }
  }

  async function handleGenerateTitle(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { description, persist } = sessionGenerateTitlePayloadSchema.parse(payload);
      const result = await ch.sendRequest(EVENTS.session.generate_title, {
        description,
        persist,
      });
      callback?.(ok({ result }));
    } catch (e) {
      callback?.(err(String(e)));
    }
  }

  function handleUpdateState(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): void {
    try {
      const { channelId, title, state } = sessionUpdateStatePayloadSchema.parse(payload);
      channelManager.broadcastSessionState(channelId, state ?? 'idle', title);
      callback?.(ok({}));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to update session state')));
    }
  }

  emitter.on(EVENTS.session.close, withChannel(handleClose));
  emitter.on(EVENTS.session.delete, handleDelete);
  emitter.on(EVENTS.session.rename, handleRename);
  emitter.on(EVENTS.session.generate_title, withChannel(handleGenerateTitle));
  emitter.on(EVENTS.session.update_state, handleUpdateState);
}
