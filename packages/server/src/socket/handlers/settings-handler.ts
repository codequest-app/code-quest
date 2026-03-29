import type { ServerToClientEvents } from '@code-quest/shared';
import {
  chatGetStateSchema,
  chatSetFastModeSchema,
  chatSetModelSchema,
  chatSetPermissionModeSchema,
  chatSetProactiveSchema,
  chatSetRemoteControlSchema,
  chatSetThinkingLevelSchema,
  settingsApplySchema,
} from '@code-quest/shared';
import { ClaudeAdapter } from '@code-quest/summoner';
import type { HandlerContext, TypedSocket } from '../handler-context.ts';
import { errMsg } from '../handler-context.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on(
    'set_model',
    async (payload, callback?: (res: { success: boolean; error?: string }) => void) => {
      try {
        const { channelId, model } = chatSetModelSchema.parse(payload);
        const channel = ctx.channelManager.get(channelId);
        if (!channel) {
          callback?.({ success: false, error: 'Session not found' });
          return;
        }
        await channel.sendControlRequest('set_model', { model });
        ctx.settingsStore.set('model', model);
        callback?.({ success: true });
      } catch (err) {
        const message = errMsg(err, 'Failed to set model');
        callback?.({ success: false, error: message });
      }
    },
  );

  socket.on(
    'set_permission_mode',
    async (payload, callback?: (res: { success: boolean; error?: string }) => void) => {
      try {
        const { channelId, mode } = chatSetPermissionModeSchema.parse(payload);
        const channel = ctx.channelManager.get(channelId);
        if (!channel) {
          callback?.({ success: false, error: 'Session not found' });
          return;
        }
        await channel.sendControlRequest('set_permission_mode', { mode });
        ctx.settingsStore.set('permissionMode', mode);
        ctx.io?.emit('state:update', { channelId, initialPermissionMode: mode });
        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: errMsg(err, 'Failed to set permission mode') });
      }
    },
  );

  socket.on(
    'set_thinking_level',
    async (payload, callback?: (res: { success: boolean; error?: string }) => void) => {
      try {
        const { channelId, thinkingLevel } = chatSetThinkingLevelSchema.parse(payload);
        const channel = ctx.channelManager.get(channelId);
        if (!channel) {
          callback?.({ success: false, error: 'Session not found' });
          return;
        }
        await channel.sendControlRequest('set_max_thinking_tokens', {
          tokens: ClaudeAdapter.THINKING_LEVEL_TOKENS[thinkingLevel] ?? 31999,
        });
        ctx.settingsStore.set('thinkingLevel', thinkingLevel);
        ctx.io?.emit('state:update', { channelId, thinkingLevel });
        callback?.({ success: true });
      } catch (err) {
        callback?.({ success: false, error: errMsg(err, 'Failed to set thinking level') });
      }
    },
  );

  socket.on('chat:set_fast_mode', async (payload) => {
    try {
      const { channelId, enabled } = chatSetFastModeSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (!channel) return;
      await channel.sendControlRequest('set_proactive', { enabled });
      ctx.io?.emit('state:update', {
        channelId,
        fastModeState: enabled ? 'on' : 'off',
      });
    } catch (err) {
      console.error('Failed to set fast mode:', err);
    }
  });

  socket.on('set_proactive', (payload) => {
    try {
      const { channelId, enabled } = chatSetProactiveSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (channel) {
        channel.sendControlRequest('set_proactive', { enabled }).catch(() => {});
      }
    } catch {
      // ignore
    }
  });

  socket.on('set_remote_control', (payload) => {
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

  socket.on('apply_settings', async (payload, callback) => {
    try {
      const { channelId, settings } = settingsApplySchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (!channel) {
        callback({ success: false, error: 'Session not found' });
        return;
      }
      await channel.sendControlRequest('apply_flag_settings', { settings });
      if (settings.effortLevel != null) {
        ctx.io?.emit('state:update', { channelId, effort: String(settings.effortLevel) });
      }
      callback({ success: true });
    } catch (err) {
      callback({
        success: false,
        error: errMsg(err, 'Invalid payload'),
      });
    }
  });

  socket.on('get_claude_state', (payload, callback) => {
    try {
      const { channelId } = chatGetStateSchema.parse(payload);
      if (!ctx.channelManager.get(channelId)) {
        callback({ success: false, error: 'Session not found' });
        return;
      }
      const state: Record<string, unknown> = {
        ...ctx.settingsStore.getAll(),
      };
      callback({ success: true, state });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Failed to get state') });
    }
  });

  socket.on('request_usage_update', async (_payload) => {
    const usage = ctx.usageTracker.getUsage();
    let contextUsage: Record<string, unknown> | undefined;

    const channel = ctx.channelManager.getFirstAlive();
    if (channel) {
      try {
        const resp = await channel.sendControlRequest('get_context_usage', {});
        if (resp.response) {
          const r = resp.response as Record<string, unknown>;
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

    const usagePayload: Record<string, unknown> = { channelId: '', usage };
    if (contextUsage) usagePayload.contextUsage = contextUsage;
    socket.emit('state:usage', usagePayload as Parameters<ServerToClientEvents['state:usage']>[0]);
  });
}
