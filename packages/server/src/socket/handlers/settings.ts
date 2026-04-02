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
import type { SettingsStore } from '../../services/settings-store.ts';
import type { UsageTracker } from '../../services/usage-tracker.ts';
import type { Channel } from '../channel.ts';
import { type ChannelEmitter, withChannel } from '../channel-emitter.ts';
import type { ChannelManager } from '../channel-manager.ts';
import { DEFAULT_THINKING_TOKENS } from '../schemas.ts';
import type { SocketCallback, SocketHandler, TypedSocket } from '../types.ts';
import { errMsg, pickDefined } from '../utils/helpers.ts';

export function create(
  channelManager: ChannelManager,
  settingsStore: SettingsStore,
  usageTracker: UsageTracker,
  emitter: ChannelEmitter,
): void {
  async function handleSetModel(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: (res: { success: boolean; error?: string }) => void,
  ): Promise<void> {
    try {
      const { channelId, model } = chatSetModelSchema.parse(payload);
      const channel = channelManager.get(channelId);
      if (!channel) {
        callback?.({ success: false, error: 'Session not found' });
        return;
      }
      await channel.sendControlRequest('set_model', { model });
      await settingsStore.set(channel.provider, 'model', model);
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to set model') });
    }
  }

  async function handleSetPermissionMode(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: (res: { success: boolean; error?: string }) => void,
  ): Promise<void> {
    try {
      const { channelId, mode } = chatSetPermissionModeSchema.parse(payload);
      const channel = channelManager.get(channelId);
      if (!channel) {
        callback?.({ success: false, error: 'Session not found' });
        return;
      }
      await channel.sendControlRequest('set_permission_mode', { mode });
      await settingsStore.set(channel.provider, 'permissionMode', mode);
      channelManager.broadcastSettingsUpdate(channelId, { initialPermissionMode: mode });
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to set permission mode') });
    }
  }

  async function handleSetThinkingLevel(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: (res: { success: boolean; error?: string }) => void,
  ): Promise<void> {
    try {
      const { channelId, thinkingLevel } = chatSetThinkingLevelSchema.parse(payload);
      const channel = channelManager.get(channelId);
      if (!channel) {
        callback?.({ success: false, error: 'Session not found' });
        return;
      }
      await channel.sendControlRequest('set_max_thinking_tokens', {
        tokens: thinkingLevel === 'off' ? 0 : DEFAULT_THINKING_TOKENS,
      });
      await settingsStore.set(channel.provider, 'thinkingLevel', thinkingLevel);
      channelManager.broadcastSettingsUpdate(channelId, { thinkingLevel });
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to set thinking level') });
    }
  }

  async function handleSetProactive(_ch: Channel | null, payload: unknown): Promise<void> {
    try {
      const { channelId, enabled } = chatSetProactiveSchema.parse(payload);
      const channel = channelManager.get(channelId);
      if (!channel) return;
      await channel.sendControlRequest('set_proactive', { enabled });
      channelManager.broadcastSettingsUpdate(channelId, {
        fastModeState: enabled ? 'on' : 'off',
      });
    } catch {
      // ignore
    }
  }

  function handleSetRemoteControl(_ch: Channel | null, payload: unknown): void {
    try {
      const { channelId, enabled } = chatSetRemoteControlSchema.parse(payload);
      const channel = channelManager.get(channelId);
      if (channel) {
        channel.sendControlRequest('remote_control', { enabled }).catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  async function handleApply(_ch: Channel | null, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback): Promise<void> {
    try {
      const { channelId, settings } = settingsApplySchema.parse(payload);
      const channel = channelManager.get(channelId);
      if (!channel) {
        callback({ success: false, error: 'Session not found' });
        return;
      }
      await channel.sendControlRequest('apply_flag_settings', { settings });
      if (settings.effortLevel != null) {
        await settingsStore.set(channel.provider, 'effortLevel', String(settings.effortLevel));
        channelManager.broadcastSettingsUpdate(channelId, {
          effort: String(settings.effortLevel),
        });
      }
      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  }

  async function handleState(_ch: Channel | null, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback): Promise<void> {
    try {
      const { channelId } = chatGetStateSchema.parse(payload);
      const channel = channelManager.get(channelId);
      if (!channel) {
        callback({ success: false, error: 'Session not found' });
        return;
      }
      const state: Record<string, unknown> = {
        ...(await settingsStore.getMany(channel.provider, [
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
  }

  async function handleRefreshUsage(_ch: Channel | null, _payload: unknown, socket?: TypedSocket): Promise<void> {
    if (!socket) return;
    const usageData = usageTracker.getUsage();
    let contextUsage: Record<string, unknown> | undefined;

    const channel = channelManager.getFirstAlive();
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
      usage: usageData,
      ...(contextUsage ? { contextUsage } : {}),
    });
  }

  function onAutoRespond(ch: Channel, payload: unknown): void {
    const action = payload as ServerAction;
    if (action.action !== 'auto_respond') return;
    const channelId = ch.id;

    switch (action.subtype) {
      case 'get_settings': {
        const state = ch.sessionState;
        const overrides = pickDefined({
          model: state.model,
          permissionMode: state.permissionMode,
        });
        void settingsStore
          .getMany(ch.provider, ['model', 'permissionMode'])
          .then((stored) => {
            ch.respondToRequest(action.requestId, { ...stored, ...overrides });
          })
          .catch(() => {
            ch.respondToRequest(action.requestId, overrides);
          });
        return;
      }
      case 'set_model': {
        const { model } = serverActionModelSchema.parse(action.input ?? {});
        ch.updateSessionState({ model });
        ch.respondToRequest(action.requestId, { subtype: 'success' });
        channelManager.broadcastSessionState(channelId, 'busy');
        return;
      }
      case 'set_permission_mode': {
        const { mode } = serverActionModeSchema.parse(action.input ?? {});
        ch.updateSessionState({ permissionMode: mode });
        ch.respondToRequest(action.requestId, { subtype: 'success' });
        channelManager.broadcastSessionState(channelId, 'busy');
        return;
      }
      default:
        ch.respondToRequest(action.requestId, action.response);
        return;
    }
  }

  emitter.on('server:action', withChannel(onAutoRespond));
  emitter.on('settings:set_model', handleSetModel);
  emitter.on('settings:set_permission_mode', handleSetPermissionMode);
  emitter.on('settings:set_thinking_level', handleSetThinkingLevel);
  emitter.on('settings:set_proactive', handleSetProactive);
  emitter.on('settings:set_remote_control', handleSetRemoteControl);
  emitter.on('settings:apply', handleApply);
  emitter.on('settings:state', handleState);
  emitter.on('settings:refresh_usage', handleRefreshUsage);
}
