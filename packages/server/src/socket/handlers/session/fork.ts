import { sessionForkPayloadSchema, sessionTeleportPayloadSchema } from '@code-quest/shared';
import type { Channel } from '../../channel.ts';
import type { ChannelEmitter } from '../../channel-emitter.ts';
import type { ChannelManager } from '../../channel-manager.ts';
import type { SessionHistory } from '../../session-history.ts';
import type { SocketCallback, TypedSocket } from '../../types.ts';
import { checkoutWithFallback, createGit } from '../../utils/git.ts';
import { errMsg } from '../../utils/helpers.ts';

export function create(
  channelManager: ChannelManager,
  sessionHistory: SessionHistory,
  emitter: ChannelEmitter,
): void {
  async function handleFork(
    _ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { forkedFromSession, resumeSessionAt, newSessionId } =
        sessionForkPayloadSchema.parse(payload);
      const parentEvents = await sessionHistory.getSessionHistory(forkedFromSession);
      await channelManager.create(newSessionId, {
        launchOptions: { resumeSessionId: forkedFromSession },
        initOptions: resumeSessionAt ? { resumeSessionAt } : undefined,
        onBeforeSpawn: (ch) => {
          ch.parentId = forkedFromSession;
          if (socket) channelManager.addSocketToChannel(ch, socket);
        },
      });
      emitter.broadcastAll('session:created', { channelId: newSessionId });
      callback?.({
        success: true,
        channelId: newSessionId,
        parentSessionId: forkedFromSession,
        events: parentEvents,
      });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to fork session') });
    }
  }

  async function handleTeleport(
    ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const parsed = sessionTeleportPayloadSchema.parse(payload);
      const events = await sessionHistory.getSessionHistory(parsed.remoteSessionId);

      let branchCheckoutFailed = false;
      if (parsed.branch) {
        try {
          await checkoutWithFallback(createGit(ch?.cwd), parsed.branch);
        } catch {
          branchCheckoutFailed = true;
        }
      }

      await channelManager.create(parsed.newSessionId, {
        launchOptions: { resumeSessionId: parsed.remoteSessionId },
        onBeforeSpawn: (newCh) => {
          if (socket) channelManager.addSocketToChannel(newCh, socket);
        },
      });

      emitter.broadcastAll('session:created', { channelId: parsed.newSessionId });
      callback?.({
        success: true,
        channelId: parsed.newSessionId,
        events,
        ...(branchCheckoutFailed && { branchCheckoutFailed: true, branch: parsed.branch }),
      });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to teleport session') });
    }
  }

  emitter.on('session:fork', handleFork);
  emitter.on('session:teleport', handleTeleport);
}
