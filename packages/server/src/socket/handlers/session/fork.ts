import { sessionForkPayloadSchema, sessionTeleportPayloadSchema } from '@code-quest/shared';
import { logger } from '../../../logger.ts';
import type { HandlerContext } from '../../../types.ts';
import type { Channel } from '../../channel.ts';
import type { SocketCallback, TypedSocket } from '../../types.ts';
import { errMsg } from '../../utils/helpers.ts';

export function create({
  channelManager,
  sessionHistory,
  emitter,
  gitService,
}: Pick<HandlerContext, 'channelManager' | 'sessionHistory' | 'emitter' | 'gitService'>): void {
  async function handleFork(
    _ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { forkedFromChannelId, resumeSessionAt, newChannelId } =
        sessionForkPayloadSchema.parse(payload);
      const parentEvents = await sessionHistory.getSessionHistory(forkedFromChannelId);
      await channelManager.create(newChannelId, {
        launchOptions: { resumeSessionId: forkedFromChannelId },
        initOptions: resumeSessionAt ? { resumeSessionAt } : undefined,
        onBeforeSpawn: (ch) => {
          ch.parentId = forkedFromChannelId;
          if (socket) channelManager.addSocketToChannel(ch, socket);
        },
      });
      emitter.broadcastAll('session:created', { channelId: newChannelId });
      callback?.({
        success: true,
        channelId: newChannelId,
        parentChannelId: forkedFromChannelId,
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
      const events = await sessionHistory.getSessionHistory(parsed.remoteChannelId);

      let branchCheckoutFailed = false;
      if (parsed.branch) {
        try {
          await gitService.checkout(ch?.cwd ?? process.cwd(), parsed.branch);
        } catch (err) {
          logger.debug(err, 'branch checkout failed during fork');
          branchCheckoutFailed = true;
        }
      }

      await channelManager.create(parsed.newChannelId, {
        launchOptions: { resumeSessionId: parsed.remoteChannelId },
        onBeforeSpawn: (newCh) => {
          if (socket) channelManager.addSocketToChannel(newCh, socket);
        },
      });

      emitter.broadcastAll('session:created', { channelId: parsed.newChannelId });
      callback?.({
        success: true,
        channelId: parsed.newChannelId,
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
