import {
  chatGenerateSessionTitleSchema,
  chatKillSchema,
  sessionDeleteSchema,
  sessionRenameSchema,
  sessionResumePayloadSchema,
  sessionUpdateStateSchema,
} from '@code-quest/shared';
import type { SessionStore } from '../../../services/session-store.ts';
import type { ChannelManager } from '../../channel-manager.ts';
import type { SocketCallback, SocketHandler, TypedSocket } from '../../types.ts';
import { errMsg } from '../../utils/helpers.ts';

export function create(channelManager: ChannelManager, sessionStore: SessionStore): SocketHandler {
  function handleClose(payload: unknown): void {
    try {
      const { channelId } = chatKillSchema.parse(payload);
      const ch = channelManager.get(channelId);
      if (ch) {
        ch.kill();
        channelManager.broadcastSessionDead(channelId);
      }
    } catch {
      // ignore
    }
  }

  function handleResume(payload: unknown): void {
    try {
      const { channelId } = sessionResumePayloadSchema.parse(payload);
      channelManager.broadcastSessionResume(channelId);
    } catch {
      // ignore
    }
  }

  async function handleDelete(payload: unknown, callback: SocketCallback): Promise<void> {
    try {
      const { channelId } = sessionDeleteSchema.parse(payload);
      const success = await sessionStore.delete(channelId);
      if (!success) {
        callback({ success: false, error: 'Session not found' });
        return;
      }
      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to delete session') });
    }
  }

  async function handleRename(payload: unknown, callback: SocketCallback): Promise<void> {
    try {
      const { channelId, title } = sessionRenameSchema.parse(payload);
      const success = await sessionStore.rename(channelId, title);
      if (!success) {
        callback({ success: false, error: 'Session not found' });
        return;
      }
      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to rename session') });
    }
  }

  async function handleGenerateTitle(payload: unknown, callback?: SocketCallback): Promise<void> {
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

  function handleUpdateState(payload: unknown, callback: SocketCallback): void {
    try {
      const { channelId, title, state } = sessionUpdateStateSchema.parse(payload);
      channelManager.broadcastSessionState(channelId, state ?? 'idle', title);
      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to update session state') });
    }
  }

  return {
    register(socket: TypedSocket) {
      socket.on('session:close', handleClose);
      socket.on('session:resume', handleResume);
      socket.on('session:delete', handleDelete);
      socket.on('session:rename', handleRename);
      socket.on('session:generate_title', handleGenerateTitle);
      socket.on('session:update_state', handleUpdateState);
    },
  };
}
