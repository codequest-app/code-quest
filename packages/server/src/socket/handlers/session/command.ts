import {
  sessionClosePayloadSchema,
  sessionDeletePayloadSchema,
  sessionGenerateTitlePayloadSchema,
  sessionRenamePayloadSchema,
  sessionResumePayloadSchema,
  sessionUpdateStatePayloadSchema,
} from '@code-quest/shared';
import { logger } from '../../../logger.ts';
import type { HandlerContext } from '../../../types.ts';
import type { Channel } from '../../channel.ts';
import { withChannel } from '../../channel-emitter.ts';
import type { SocketCallback, TypedSocket } from '../../types.ts';
import { errMsg } from '../../utils/helpers.ts';

export function create({
  channelManager,
  sessionStore,
  emitter,
}: Pick<HandlerContext, 'channelManager' | 'sessionStore' | 'emitter'>): void {
  function handleClose(ch: Channel, payload: unknown): void {
    try {
      const { channelId } = sessionClosePayloadSchema.parse(payload);
      ch.kill();
      emitter.broadcastAll('session:dead', { channelId });
    } catch (err) {
      logger.warn({ err }, 'Failed to close session');
    }
  }

  function handleResume(_ch: Channel | null, payload: unknown): void {
    try {
      const { channelId } = sessionResumePayloadSchema.parse(payload);
      emitter.broadcastAll('session:resume', { channelId });
    } catch (err) {
      logger.warn({ err }, 'Failed to resume session');
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
      const record = await sessionStore.getByChannelId(channelId);
      const success = record ? await sessionStore.delete(record.id) : false;
      if (!success) {
        callback?.({ success: false, error: 'Session not found' });
        return;
      }
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to delete session') });
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
      const record = await sessionStore.getByChannelId(channelId);
      const success = record ? await sessionStore.rename(record.id, title) : false;
      if (!success) {
        callback?.({ success: false, error: 'Session not found' });
        return;
      }
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to rename session') });
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
      const result = await ch.sendRequest('session:generate_title', {
        description,
        persist,
      });
      callback?.({ success: true, result });
    } catch (err) {
      callback?.({ success: false, error: String(err) });
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
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to update session state') });
    }
  }

  emitter.on('session:close', withChannel(handleClose));
  emitter.on('session:resume', handleResume);
  emitter.on('session:delete', handleDelete);
  emitter.on('session:rename', handleRename);
  emitter.on('session:generate_title', withChannel(handleGenerateTitle));
  emitter.on('session:update_state', handleUpdateState);
}
