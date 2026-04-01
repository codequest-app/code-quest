import { sessionForkSchema, sessionTeleportSchema } from '@code-quest/shared';
import type { SessionStore } from '../../../services/session-store.ts';
import type { ChannelManager } from '../../channel-manager.ts';
import type { SessionHistory } from '../../session-history.ts';
import type { SocketCallback, SocketHandler, TypedSocket } from '../../types.ts';
import { checkoutBranch } from '../../utils/exec-git.ts';
import { errMsg } from '../../utils/helpers.ts';
import { persistNewSession } from './persist.ts';

export function create(
  channelManager: ChannelManager,
  sessionHistory: SessionHistory,
  sessionStore: SessionStore,
): SocketHandler {
  async function handleFork(
    socket: TypedSocket,
    payload: unknown,
    callback: SocketCallback,
  ): Promise<void> {
    try {
      const { forkedFromSession, resumeSessionAt, newSessionId } = sessionForkSchema.parse(payload);
      const parentEvents = await sessionHistory.getSessionHistory(forkedFromSession);
      const { channel: forkChannel } = await channelManager.create(newSessionId, {
        launchOptions: { resumeSessionId: forkedFromSession },
        initOptions: resumeSessionAt ? { resumeSessionAt } : undefined,
        onBeforeSpawn: (ch) => channelManager.addSocketToChannel(ch, socket),
      });

      if (forkChannel.sessionId) {
        persistNewSession(channelManager, sessionStore, {
          channelId: newSessionId,
          sessionId: forkChannel.sessionId,
          parentId: forkedFromSession,
        });
      }
      channelManager.broadcastSessionCreated(newSessionId);
      callback({
        success: true,
        channelId: newSessionId,
        parentSessionId: forkedFromSession,
        events: parentEvents,
      });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to fork session') });
    }
  }

  async function handleTeleport(
    socket: TypedSocket,
    payload: unknown,
    callback: SocketCallback,
  ): Promise<void> {
    try {
      const parsed = sessionTeleportSchema.parse(payload);
      const events = await sessionHistory.getSessionHistory(parsed.remoteSessionId);

      let branchCheckoutFailed = false;
      if (parsed.branch) {
        try {
          await checkoutBranch(parsed.branch);
        } catch {
          branchCheckoutFailed = true;
        }
      }

      await channelManager.create(parsed.newSessionId, {
        launchOptions: { resumeSessionId: parsed.remoteSessionId },
        onBeforeSpawn: (ch) => channelManager.addSocketToChannel(ch, socket),
      });

      channelManager.broadcastSessionCreated(parsed.newSessionId);
      callback({
        success: true,
        channelId: parsed.newSessionId,
        events,
        ...(branchCheckoutFailed && { branchCheckoutFailed: true, branch: parsed.branch }),
      });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to teleport session') });
    }
  }

  return {
    register(socket: TypedSocket) {
      socket.on('session:fork', (p, cb) => handleFork(socket, p, cb));
      socket.on('session:teleport', (p, cb) => handleTeleport(socket, p, cb));
    },
  };
}
