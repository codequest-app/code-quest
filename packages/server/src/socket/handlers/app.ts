import { EVENTS } from '@code-quest/shared';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';

export function create({
  channelManager,
  settingsStore,
  emitter,
  gitService,
}: Pick<HandlerContext, 'channelManager' | 'settingsStore' | 'emitter' | 'gitService'>): void {
  async function handleInit(
    _ch: Channel | null,
    _payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    const sessions = channelManager.getAliveChannels().map(([id, ch]) => ({
      channelId: id,
      state: ch.isProcessing ? 'busy' : 'idle',
      title: ch.title,
      cwd: ch.cwd,
      ...(ch.projectRoot ? { projectRoot: ch.projectRoot } : {}),
    }));
    let settings: Record<string, unknown> = {};
    try {
      settings = await settingsStore.getMany(channelManager.provider, [
        'model',
        'permissionMode',
        'thinkingLevel',
        'effortLevel',
      ]);
    } catch (err) {
      logger.debug({ err }, 'Settings table may not exist yet');
    }
    callback?.({
      settings,
      sessions,
      models: channelManager.cachedModels,
      state: {
        platform: process.platform,
        speechToTextEnabled: false,
        browserIntegrationSupported: false,
      },
      capabilities: { worktree: gitService.capabilities.worktree },
    });
  }

  async function handleConfig(
    _ch: Channel | null,
    _payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    let models: unknown[] | undefined = channelManager.cachedModels;
    let effort: unknown;
    try {
      if (!models) {
        const raw = await settingsStore.get(channelManager.provider, 'models');
        if (Array.isArray(raw)) models = raw;
      }
      effort = await settingsStore.get(channelManager.provider, 'effortLevel');
    } catch (err) {
      logger.debug({ err }, 'Settings table may not exist yet');
    }
    callback?.({
      providerConfig: channelManager.providerClientConfig,
      ...(models ? { models } : {}),
      ...(typeof effort === 'string' ? { effort } : {}),
    });
  }

  function handleDisconnect(_ch: Channel | null, _payload: unknown, socket?: TypedSocket): void {
    if (socket) {
      channelManager.removeSocketFromAll(socket.id);
    }
  }

  emitter.on(EVENTS.app.init, handleInit);
  emitter.on(EVENTS.app.config, handleConfig);
  emitter.on('disconnect', handleDisconnect);
}
