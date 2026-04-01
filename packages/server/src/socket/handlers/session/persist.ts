import { logger } from '../../../logger.ts';
import type { SessionStore } from '../../../services/session-store.ts';
import type { ChannelManager } from '../../channel-manager.ts';

export function persistNewSession(
  ctx: { channelManager: ChannelManager; sessionStore: SessionStore },
  opts: { channelId: string; sessionId: string; parentId?: string },
): void {
  ctx.sessionStore
    .persist({
      id: opts.channelId,
      sessionId: opts.sessionId,
      provider: ctx.channelManager.provider,
      command: ctx.channelManager.runnerCommand,
      args: JSON.stringify(ctx.channelManager.runnerArgs),
      cwd: process.cwd(),
      mode: 'interactive',
      role: 'chat',
      ...(opts.parentId ? { parentId: opts.parentId } : {}),
      createdAt: new Date().toISOString(),
    })
    .catch((err) => logger.error({ err }, 'Failed to persist session'));
}
