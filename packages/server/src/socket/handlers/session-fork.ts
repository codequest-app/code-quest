import { sessionForkSchema, sessionTeleportSchema } from '@code-quest/shared';
import type { HandlerContext, TypedSocket } from '../handler-context.ts';
import { errMsg } from '../handler-context.ts';
import { execGit } from './exec-git.ts';
import { persistNewSession } from './session-lifecycle.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on('session:fork', async (payload, callback) => {
    try {
      const { forkedFromSession, resumeSessionAt, newSessionId } = sessionForkSchema.parse(payload);
      const parentEvents = await ctx.getSessionHistory(forkedFromSession);
      const hooks = ctx.buildChannelHooks(newSessionId);
      const { channel: forkChannel } = await ctx.channelManager.create(newSessionId, {
        hooks,
        launchOptions: { resumeSessionId: forkedFromSession },
        initOptions: resumeSessionAt ? { resumeSessionAt } : undefined,
        onBeforeSpawn: (ch) => ctx.addSocketToChannel(ch, socket),
      });

      if (forkChannel.sessionId) {
        persistNewSession(ctx, {
          channelId: newSessionId,
          sessionId: forkChannel.sessionId,
          parentId: forkedFromSession,
        });
      }
      ctx.io?.emit('session:created', { channelId: newSessionId });
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
      const events = await ctx.getSessionHistory(parsed.remoteSessionId);

      let branchCheckoutFailed = false;
      if (parsed.branch) {
        const branch = parsed.branch;
        const strategies = [
          () => execGit(['checkout', branch]),
          async () => {
            await execGit(['fetch', 'origin']);
            await execGit(['checkout', branch]);
          },
          () => execGit(['checkout', '--track', `origin/${branch}`]),
        ];
        branchCheckoutFailed = true;
        for (const strategy of strategies) {
          try {
            await strategy();
            branchCheckoutFailed = false;
            break;
          } catch {
            /* try next */
          }
        }
      }

      const hooks = ctx.buildChannelHooks(parsed.newSessionId);
      await ctx.channelManager.create(parsed.newSessionId, {
        hooks,
        launchOptions: { resumeSessionId: parsed.remoteSessionId },
        onBeforeSpawn: (ch) => ctx.addSocketToChannel(ch, socket),
      });

      ctx.io?.emit('session:created', { channelId: parsed.newSessionId });
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
