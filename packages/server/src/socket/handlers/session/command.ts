import {
  chatGenerateSessionTitleSchema,
  chatKillSchema,
  sessionDeleteSchema,
  sessionRenameSchema,
  sessionResumePayloadSchema,
  sessionUpdateStateSchema,
} from '@code-quest/shared';
import type { SessionStore } from '../../../services/session-store.ts';
import type { Channel } from '../../channel.ts';
import type { ChannelEmitter } from '../../channel-emitter.ts';
import type { ChannelManager } from '../../channel-manager.ts';
import type { SocketCallback, TypedSocket } from '../../types.ts';
import { errMsg } from '../../utils/helpers.ts';

export function create(
  channelManager: ChannelManager,
  sessionStore: SessionStore,
  emitter: ChannelEmitter,
): void {
  function handleClose(
    _ch: Channel | null,
    payload: unknown,
  ): void {
    try {
      const { channelId } = chatKillSchema.parse(payload);
      const ch = channelManager.get(channelId);
      if (ch) {
        ch.kill();
        emitter.broadcastAll('session:dead', { channelId });
      }
    } catch {
      // ignore
    }
  }

  function handleResume(
    _ch: Channel | null,
    payload: unknown,
  ): void {
    try {
      const { channelId } = sessionResumePayloadSchema.parse(payload);
      emitter.broadcastAll('session:resume', { channelId });
    } catch {
      // ignore
    }
  }

  async function handleDelete(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { channelId } = sessionDeleteSchema.parse(payload);
      const success = await sessionStore.delete(channelId);
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
      const { channelId, title } = sessionRenameSchema.parse(payload);
      const success = await sessionStore.rename(channelId, title);
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
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { channelId, description, persist } = chatGenerateSessionTitleSchema.parse(payload);
      const channel = channelManager.get(channelId);
      if (channel) {
        const result = await channel.sendControlRequest('generate_session_title', {
          description,
          persist,
        });
        callback?.({ success: true, result });
      }
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
      const { channelId, title, state } = sessionUpdateStateSchema.parse(payload);
      channelManager.broadcastSessionState(channelId, state ?? 'idle', title);
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to update session state') });
    }
  }

  emitter.on('session:close', handleClose);
  emitter.on('session:resume', handleResume);
  emitter.on('session:delete', handleDelete);
  emitter.on('session:rename', handleRename);
  emitter.on('session:generate_title', handleGenerateTitle);
  emitter.on('session:update_state', handleUpdateState);
}
