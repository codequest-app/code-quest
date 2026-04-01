import { sessionForkSchema, sessionTeleportSchema } from '@code-quest/shared';
import type { HandlerContext } from '../../context.ts';
import type { TypedSocket } from '../../types.ts';
import { errMsg } from '../../types.ts';
import { checkoutBranch } from '../../utils/exec-git.ts';
import { persistNewSession } from './persist.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on('session:fork', async (payload, callback) => {
    try {
      const { forkedFromSession, resumeSessionAt, newSessionId } = sessionForkSchema.parse(payload);
      const parentEvents = await ctx.sessionHistory.getSessionHistory(forkedFromSession);
      const { channel: forkChannel } = await ctx.channelManager.create(newSessionId, {
        launchOptions: { resumeSessionId: forkedFromSession },
        initOptions: resumeSessionAt ? { resumeSessionAt } : undefined,
        onBeforeSpawn: (ch) => ctx.channelManager.addSocketToChannel(ch, socket),
      });

      if (forkChannel.sessionId) {
        persistNewSession(ctx, {
          channelId: newSessionId,
          sessionId: forkChannel.sessionId,
          parentId: forkedFromSession,
        });
      }
      ctx.channelManager.broadcastSessionCreated(newSessionId);
      callback({
        success: true,
        channelId: newSessionId,
        parentSessionId: forkedFromSession,
        events: parentEvents,
      });
    } catch (err) {
      callback({
        success: false,
        error: errMsg(err, 'Failed to fork session'),
      });
    }
  });

  socket.on('session:teleport', async (payload, callback) => {
    try {
      const parsed = sessionTeleportSchema.parse(payload);
      const events = await ctx.sessionHistory.getSessionHistory(parsed.remoteSessionId);

      let branchCheckoutFailed = false;
      if (parsed.branch) {
        try {
          await checkoutBranch(parsed.branch);
        } catch {
          branchCheckoutFailed = true;
        }
      }

      await ctx.channelManager.create(parsed.newSessionId, {
        launchOptions: { resumeSessionId: parsed.remoteSessionId },
        onBeforeSpawn: (ch) => ctx.channelManager.addSocketToChannel(ch, socket),
      });

      ctx.channelManager.broadcastSessionCreated(parsed.newSessionId);
      callback({
        success: true,
        channelId: parsed.newSessionId,
        events,
        ...(branchCheckoutFailed && { branchCheckoutFailed: true, branch: parsed.branch }),
      });
    } catch (err) {
      callback({
        success: false,
        error: errMsg(err, 'Failed to teleport session'),
      });
    }
  });
}
