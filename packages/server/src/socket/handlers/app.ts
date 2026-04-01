import type { HandlerContext } from '../context.ts';
import type { SocketHandler, TypedSocket } from '../types.ts';

export function create(ctx: HandlerContext): SocketHandler {
  async function handleInit(callback: Function): Promise<void> {
    const sessions = ctx.channelManager.getAliveChannels().map((ch) => ({
      channelId: ch.channelId,
      state: ch.state,
      title: ch.title,
      modelSetting: ch.model,
    }));
    let settings: Record<string, unknown> = {};
    try {
      settings = await ctx.settingsStore.getMany(ctx.channelManager.provider, [
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
      models: ctx.cachedModels,
      state: {
        platform: process.platform,
        speechToTextEnabled: false,
        browserIntegrationSupported: false,
      },
    });
  }

  async function handleConfig(_payload: unknown, callback: Function): Promise<void> {
    let models: unknown[] | undefined = ctx.cachedModels;
    let effort: string | undefined;
    try {
      if (!models) {
        models = (await ctx.settingsStore.get(ctx.channelManager.provider, 'models')) as
          | unknown[]
          | undefined;
      }
      effort = (await ctx.settingsStore.get(ctx.channelManager.provider, 'effortLevel')) as
        | string
        | undefined;
    } catch {
      // Settings table may not exist yet
    }
    callback({
      providerConfig: ctx.channelManager.providerClientConfig,
      ...(Array.isArray(models) ? { models } : {}),
      ...(typeof effort === 'string' ? { effort } : {}),
    });
  }

  function handleDisconnect(socket: TypedSocket): void {
    ctx.channelManager.removeSocketFromAll(socket.id);
  }

  return {
    register(socket: TypedSocket) {
      socket.on('app:init', handleInit);
      socket.on('app:config', handleConfig);
      socket.on('disconnect', () => handleDisconnect(socket));
    },
  };
}
