import type { SettingsStore } from '../../services/settings-store.ts';
import type { ChannelManager } from '../channel-manager.ts';
import type { SocketHandler, TypedSocket } from '../types.ts';

export function create(
  channelManager: ChannelManager,
  settingsStore: SettingsStore,
): SocketHandler {
  async function handleInit(callback: Function): Promise<void> {
    const sessions = channelManager.getAliveChannels().map((ch) => ({
      channelId: ch.channelId,
      state: ch.state,
      title: ch.title,
      modelSetting: ch.model,
    }));
    let settings: Record<string, unknown> = {};
    try {
      settings = await settingsStore.getMany(channelManager.provider, [
        'model',
        'permissionMode',
        'thinkingLevel',
        'effortLevel',
      ]);
    } catch {
      // Settings table may not exist yet
    }
    callback({
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

  async function handleConfig(_payload: unknown, callback: Function): Promise<void> {
    let models: unknown[] | undefined = channelManager.cachedModels;
    let effort: string | undefined;
    try {
      if (!models) {
        models = (await settingsStore.get(channelManager.provider, 'models')) as
          | unknown[]
          | undefined;
      }
      effort = (await settingsStore.get(channelManager.provider, 'effortLevel')) as
        | string
        | undefined;
    } catch {
      // Settings table may not exist yet
    }
    callback({
      providerConfig: channelManager.providerClientConfig,
      ...(Array.isArray(models) ? { models } : {}),
      ...(typeof effort === 'string' ? { effort } : {}),
    });
  }

  function handleDisconnect(socket: TypedSocket): void {
    channelManager.removeSocketFromAll(socket.id);
  }

  return {
    register(socket: TypedSocket) {
      socket.on('app:init', handleInit);
      socket.on('app:config', handleConfig);
      socket.on('disconnect', () => handleDisconnect(socket));
    },
  };
}
