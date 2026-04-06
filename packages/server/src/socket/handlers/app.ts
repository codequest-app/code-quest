import { logger } from '../../logger.ts';
import type { SettingsStore } from '../../services/settings-store.ts';
import type { Channel } from '../channel.ts';
import type { ChannelEmitter } from '../channel-emitter.ts';
import type { ChannelManager } from '../channel-manager.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';

export function create(
  channelManager: ChannelManager,
  settingsStore: SettingsStore,
  emitter: ChannelEmitter,
): void {
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
      modelSetting: ch.sessionConfig?.model,
      cwd: ch.cwd,
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
      ...(Array.isArray(models) ? { models } : {}),
      ...(typeof effort === 'string' ? { effort } : {}),
    });
  }

  function handleDisconnect(_ch: Channel | null, _payload: unknown, socket?: TypedSocket): void {
    if (socket) {
      channelManager.removeSocketFromAll(socket.id);
    }
  }

  emitter.on('app:init', handleInit);
  emitter.on('app:config', handleConfig);
  emitter.on('disconnect', handleDisconnect);
}
