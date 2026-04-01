import type { HandlerContext } from '../context.ts';
import type { TypedSocket } from '../types.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on('app:init', async (callback) => {
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
      // Settings table may not exist yet — use empty defaults
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
  });

  socket.on('app:config', async (_payload, callback) => {
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
      // Settings table may not exist yet — use defaults from providerConfig
    }
    callback({
      providerConfig: ctx.channelManager.providerClientConfig,
      ...(Array.isArray(models) ? { models } : {}),
      ...(typeof effort === 'string' ? { effort } : {}),
    });
  });

  socket.on('disconnect', () => {
    ctx.channelManager.removeSocketFromAll(socket.id);
  });
}
