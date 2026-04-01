import { logger } from '../../../logger.ts';
import type { SessionStore } from '../../../services/session-store.ts';
import type { ChannelManager } from '../../channel-manager.ts';

export function persistNewSession(
  channelManager: ChannelManager,
  sessionStore: SessionStore,
  opts: { channelId: string; sessionId: string; parentId?: string },
): void {
  sessionStore
    .persist({
      id: opts.channelId,
      sessionId: opts.sessionId,
      provider: channelManager.provider,
      command: channelManager.runnerCommand,
      args: JSON.stringify(channelManager.runnerArgs),
      cwd: process.cwd(),
      mode: 'interactive',
      role: 'chat',
      ...(opts.parentId ? { parentId: opts.parentId } : {}),
      createdAt: new Date().toISOString(),
    })
    .catch((err) => logger.error({ err }, 'Failed to persist session'));
}
