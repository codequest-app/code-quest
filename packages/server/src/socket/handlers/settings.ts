import {
  chatGetStateSchema,
  chatSetModelSchema,
  chatSetPermissionModeSchema,
  chatSetProactiveSchema,
  chatSetRemoteControlSchema,
  chatSetThinkingLevelSchema,
  serverActionModelSchema,
  serverActionModeSchema,
  settingsApplySchema,
} from '@code-quest/shared';
import type { ServerAction } from '@code-quest/summoner';
import type { Channel } from '../channel.ts';
import type { HandlerContext } from '../context.ts';
import type { TypedSocket } from '../types.ts';
import { errMsg, pickDefined } from '../types.ts';
import { DEFAULT_THINKING_TOKENS } from './session/lifecycle.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on(
    'settings:set_model',
    async (payload, callback?: (res: { success: boolean; error?: string }) => void) => {
      try {
        const { channelId, model } = chatSetModelSchema.parse(payload);
        const channel = ctx.channelManager.get(channelId);
        if (!channel) {
          callback?.({ success: false, error: 'Session not found' });
          return;
        }
        await channel.sendControlRequest('set_model', { model });
        await ctx.settingsStore.set(channel.provider, 'model', model);
        callback?.({ success: true });
      } catch (err) {
        const message = errMsg(err, 'Failed to set model');
        callback?.({ success: false, error: message });
      }
    },
  );

  socket.on(
    'settings:set_permission_mode',
    async (payload, callback?: (res: { success: boolean; error?: string }) => void) => {
      try {
        const { channelId, mode } = chatSetPermissionModeSchema.parse(payload);
        const channel = ctx.channelManager.get(channelId);
        if (!channel) {
          callback?.({ success: false, error: 'Session not found' });
          return;
        }
        await channel.sendControlRequest('set_permission_mode', { mode });
        await ctx.settingsStore.set(channel.provider, 'permissionMode', mode);
        ctx.io?.emit('settings:update', { channelId, initialPermissionMode: mode });
        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: errMsg(err, 'Failed to set permission mode') });
      }
    },
  );

  socket.on(
    'settings:set_thinking_level',
    async (payload, callback?: (res: { success: boolean; error?: string }) => void) => {
      try {
        const { channelId, thinkingLevel } = chatSetThinkingLevelSchema.parse(payload);
        const channel = ctx.channelManager.get(channelId);
        if (!channel) {
          callback?.({ success: false, error: 'Session not found' });
          return;
        }
        await channel.sendControlRequest('set_max_thinking_tokens', {
          tokens: thinkingLevel === 'off' ? 0 : DEFAULT_THINKING_TOKENS,
        });
        await ctx.settingsStore.set(channel.provider, 'thinkingLevel', thinkingLevel);
        ctx.io?.emit('settings:update', { channelId, thinkingLevel });
        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: errMsg(err, 'Failed to set thinking level') });
      }
    },
  );

  socket.on('settings:set_proactive', async (payload) => {
    try {
      const { channelId, enabled } = chatSetProactiveSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (!channel) return;
      await channel.sendControlRequest('set_proactive', { enabled });
      ctx.io?.emit('settings:update', {
        channelId,
        fastModeState: enabled ? 'on' : 'off',
      });
    } catch {
      // ignore
    }
  });

  socket.on('settings:set_remote_control', (payload) => {
    try {
      const { channelId, enabled } = chatSetRemoteControlSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (channel) {
        channel.sendControlRequest('remote_control', { enabled }).catch(() => {});
      }
    } catch {
      // ignore
    }
  });

  socket.on('settings:apply', async (payload, callback) => {
    try {
      const { channelId, settings } = settingsApplySchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (!channel) {
        callback({ success: false, error: 'Session not found' });
        return;
      }
      await channel.sendControlRequest('apply_flag_settings', { settings });
      if (settings.effortLevel != null) {
        await ctx.settingsStore.set(channel.provider, 'effortLevel', String(settings.effortLevel));
        ctx.io?.emit('settings:update', { channelId, effort: String(settings.effortLevel) });
      }
      callback({ success: true });
    } catch (err) {
      callback({
        success: false,
        error: errMsg(err, 'Invalid payload'),
      });
    }
  });

  socket.on('settings:state', async (payload, callback) => {
    try {
      const { channelId } = chatGetStateSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (!channel) {
        callback({ success: false, error: 'Session not found' });
        return;
      }
      const state: Record<string, unknown> = {
        ...(await ctx.settingsStore.getMany(channel.provider, [
          'model',
          'permissionMode',
          'thinkingLevel',
          'effortLevel',
        ])),
      };
      callback({ success: true, state });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to get state') });
    }
  });

  socket.on('settings:refresh_usage', async (_payload) => {
    const usage = ctx.usageTracker.getUsage();
    let contextUsage: Record<string, unknown> | undefined;

    const channel = ctx.channelManager.getFirstAlive();
    if (channel) {
      try {
        const resp = await channel.sendControlRequest('get_context_usage', {});
        if (resp.response) {
          const r = resp.response;
          contextUsage = {
            categories: r.categories,
            totalTokens: r.totalTokens,
            maxTokens: r.maxTokens,
            percentage: r.percentage,
          };
        }
      } catch {
        // CLI may not support get_context_usage — ignore
      }
    }

    socket.emit('settings:usage', {
      channelId: '',
      usage,
      ...(contextUsage ? { contextUsage } : {}),
    });
  });
}

export function onServerAction(
  ctx: HandlerContext,
  channelId: string,
  ch: Channel,
  action: ServerAction,
): boolean {
  if (action.action !== 'auto_respond') return false;

  switch (action.subtype) {
    case 'get_settings': {
      const state = ch.sessionState;
      const overrides = pickDefined({
        model: state.model,
        permissionMode: state.permissionMode,
      });
      void ctx.settingsStore
        .getMany(ch.provider, ['model', 'permissionMode'])
        .then((stored) => {
          ch.respondToRequest(action.requestId, {
            ...stored,
            ...overrides,
          });
        })
        .catch(() => {
          ch.respondToRequest(action.requestId, overrides);
        });
      return true;
    }
    case 'set_model': {
      const { model } = serverActionModelSchema.parse(action.input ?? {});
      ch.updateSessionState({ model });
      ch.respondToRequest(action.requestId, { subtype: 'success' });
      ctx.channelManager.broadcastSessionState(channelId, 'busy');
      return true;
    }
    case 'set_permission_mode': {
      const { mode } = serverActionModeSchema.parse(action.input ?? {});
      ch.updateSessionState({ permissionMode: mode });
      ch.respondToRequest(action.requestId, { subtype: 'success' });
      ctx.channelManager.broadcastSessionState(channelId, 'busy');
      return true;
    }
    default:
      ch.respondToRequest(action.requestId, action.response);
      return true;
  }
}
