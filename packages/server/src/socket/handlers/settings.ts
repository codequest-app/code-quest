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
import { type ChannelEmitter, withChannel, withError } from '../channel-emitter.ts';
import type { ChannelManager } from '../channel-manager.ts';
import { DEFAULT_THINKING_TOKENS } from '../schemas.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg, pickDefined } from '../utils/helpers.ts';

export function create(
  channelManager: ChannelManager,
  settingsStore: SettingsStore,
  usageTracker: UsageTracker,
  emitter: ChannelEmitter,
): void {
  async function handleSetModel(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: (res: { success: boolean; error?: string }) => void,
  ): Promise<void> {
    try {
      const { model } = chatSetModelSchema.parse(payload);
      await ch.sendControlRequest('set_model', { model });
      await settingsStore.set(ch.provider, 'model', model);
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to set model') });
    }
  }

  async function handleSetPermissionMode(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: (res: { success: boolean; error?: string }) => void,
  ): Promise<void> {
    try {
      const { channelId, mode } = chatSetPermissionModeSchema.parse(payload);
      await ch.sendControlRequest('set_permission_mode', { mode });
      await settingsStore.set(ch.provider, 'permissionMode', mode);
      emitter.broadcastAll('settings:update', { channelId, initialPermissionMode: mode });
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to set permission mode') });
    }
  }

  async function handleSetThinkingLevel(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: (res: { success: boolean; error?: string }) => void,
  ): Promise<void> {
    try {
      const { channelId, thinkingLevel } = chatSetThinkingLevelSchema.parse(payload);
      await ch.sendControlRequest('set_max_thinking_tokens', {
        tokens: thinkingLevel === 'off' ? 0 : DEFAULT_THINKING_TOKENS,
      });
      await settingsStore.set(ch.provider, 'thinkingLevel', thinkingLevel);
      emitter.broadcastAll('settings:update', { channelId, thinkingLevel });
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to set thinking level') });
    }
  }

  async function handleSetProactive(ch: Channel, payload: unknown): Promise<void> {
    try {
      const { channelId, enabled } = chatSetProactiveSchema.parse(payload);
      await ch.sendControlRequest('set_proactive', { enabled });
      emitter.broadcastAll('settings:update', {
        channelId,
        fastModeState: enabled ? 'on' : 'off',
      });
    } catch {
      // ignore
    }
  }

  function handleSetRemoteControl(ch: Channel, payload: unknown): void {
    try {
      const { enabled } = chatSetRemoteControlSchema.parse(payload);
      ch.sendControlRequest('remote_control', { enabled }).catch(() => {});
    } catch {
      // ignore
    }
  }

  async function handleApply(ch: Channel, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback): Promise<void> {
    try {
      const { channelId, settings } = settingsApplySchema.parse(payload);
      await ch.sendControlRequest('apply_flag_settings', { settings });
      if (settings.effortLevel != null) {
        await settingsStore.set(ch.provider, 'effortLevel', String(settings.effortLevel));
        emitter.broadcastAll('settings:update', {
          channelId,
          effort: String(settings.effortLevel),
        });
      }
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Invalid payload') });
    }
  }

  async function handleState(ch: Channel, payload: unknown, _socket?: TypedSocket, callback?: SocketCallback): Promise<void> {
    try {
      const state: Record<string, unknown> = {
        ...(await settingsStore.getMany(ch.provider, [
          'model',
          'permissionMode',
          'thinkingLevel',
          'effortLevel',
        ])),
      };
      callback?.({ success: true, state });
    } catch (err) {
      callback?.({ success: false, error: errMsg(err, 'Failed to get state') });
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
        const state = ch.sessionConfig;
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
        ch.updateSessionConfig({ model });
        ch.respondToRequest(action.requestId, { subtype: 'success' });
        channelManager.broadcastSessionConfig(channelId, 'busy');
        return;
      }
      case 'set_permission_mode': {
        const { mode } = serverActionModeSchema.parse(action.input ?? {});
        ch.updateSessionConfig({ permissionMode: mode });
        ch.respondToRequest(action.requestId, { subtype: 'success' });
        channelManager.broadcastSessionConfig(channelId, 'busy');
        return;
      }
      default:
        ch.respondToRequest(action.requestId, action.response);
        return;
    }
  }

  emitter.on('server:action', withChannel(onAutoRespond));
  emitter.on('settings:set_model', withError(withChannel(handleSetModel)));
  emitter.on('settings:set_permission_mode', withError(withChannel(handleSetPermissionMode)));
  emitter.on('settings:set_thinking_level', withError(withChannel(handleSetThinkingLevel)));
  emitter.on('settings:set_proactive', withChannel(handleSetProactive));
  emitter.on('settings:set_remote_control', withChannel(handleSetRemoteControl));
  emitter.on('settings:apply', withError(withChannel(handleApply)));
  emitter.on('settings:state', withError(withChannel(handleState)));
  emitter.on('settings:refresh_usage', handleRefreshUsage);
}
