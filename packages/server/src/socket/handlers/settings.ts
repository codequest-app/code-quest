import {
  requestIdPayloadSchema,
  serverActionModelSchema,
  serverActionModeSchema,
  settingsApplyPayloadSchema,
  settingsSetModelPayloadSchema,
  settingsSetPermissionModePayloadSchema,
  settingsSetProactivePayloadSchema,
  settingsSetRemoteControlPayloadSchema,
  settingsSetThinkingLevelPayloadSchema,
  settingsUpdatedPayloadSchema,
} from '@code-quest/shared';
import { logger } from '../../logger.ts';
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
      const { model } = settingsSetModelPayloadSchema.parse(payload);
      await ch.sendRequest('settings:set_model', { model });
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
      const { channelId, mode } = settingsSetPermissionModePayloadSchema.parse(payload);
      await ch.sendRequest('settings:set_permission_mode', { mode });
      ch.updateSessionConfig({ permissionMode: mode });
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
      const { channelId, thinkingLevel } = settingsSetThinkingLevelPayloadSchema.parse(payload);
      await ch.sendRequest('settings:set_thinking_level', {
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
      const { channelId, enabled } = settingsSetProactivePayloadSchema.parse(payload);
      await ch.sendRequest('settings:set_proactive', { enabled });
      emitter.broadcastAll('settings:update', {
        channelId,
        fastModeState: enabled ? 'on' : 'off',
      });
    } catch (err) {
      logger.warn({ err }, 'Failed to set proactive mode');
    }
  }

  function handleSetRemoteControl(ch: Channel, payload: unknown): void {
    try {
      const { enabled } = settingsSetRemoteControlPayloadSchema.parse(payload);
      ch.sendRequest('settings:remote_control', { enabled }).catch(() => {});
    } catch (err) {
      logger.warn({ err }, 'Failed to set remote control');
    }
  }

  async function handleApply(
    ch: Channel,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { channelId, settings } = settingsApplyPayloadSchema.parse(payload);
      await ch.sendRequest('settings:apply', { settings });
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

  async function handleState(
    ch: Channel,
    _payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
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

  async function handleRefreshUsage(
    _ch: Channel | null,
    _payload: unknown,
    socket?: TypedSocket,
  ): Promise<void> {
    if (!socket) return;
    const usageData = usageTracker.getUsage();
    let contextUsage: Record<string, unknown> | undefined;

    const channel = channelManager.getFirstAlive();
    if (channel) {
      try {
        const resp = await channel.sendRequest('settings:get_context_usage');
        if (resp.response) {
          const r = resp.response;
          contextUsage = {
            categories: r.categories,
            totalTokens: r.totalTokens,
            maxTokens: r.maxTokens,
            percentage: r.percentage,
          };
        }
      } catch (err) {
        logger.debug({ err }, 'CLI may not support get_context_usage');
      }
    }

    socket.emit('settings:usage', {
      channelId: '',
      usage: usageData,
      ...(contextUsage ? { contextUsage } : {}),
    });
  }

  async function onGetSettings(ch: Channel, payload: unknown): Promise<void> {
    const { requestId } = requestIdPayloadSchema.parse(payload);
    const state = ch.sessionConfig;
    const overrides = pickDefined({
      model: state.model,
      permissionMode: state.permissionMode,
    });
    try {
      const stored = await settingsStore.getMany(ch.provider, ['model', 'permissionMode']);
      ch.respondToRequest(requestId, { ...stored, ...overrides });
    } catch (err) {
      logger.warn({ err }, 'Failed to get stored settings');
      ch.respondToRequest(requestId, overrides);
    }
  }

  function onModelUpdated(ch: Channel, payload: unknown): void {
    const { requestId, input } = settingsUpdatedPayloadSchema.parse(payload);
    const { model } = serverActionModelSchema.parse(input ?? {});
    ch.updateSessionConfig({ model });
    ch.respondToRequest(requestId, { subtype: 'success' });
    channelManager.broadcastSessionState(ch.id, 'busy');
  }

  function onPermissionModeUpdated(ch: Channel, payload: unknown): void {
    const { requestId, input } = settingsUpdatedPayloadSchema.parse(payload);
    const { mode } = serverActionModeSchema.parse(input ?? {});
    ch.updateSessionConfig({ permissionMode: mode });
    ch.respondToRequest(requestId, { subtype: 'success' });
    channelManager.broadcastSessionState(ch.id, 'busy');
  }

  emitter.on('settings:get_settings', withChannel(onGetSettings));
  emitter.on('settings:model_updated', withChannel(onModelUpdated));
  emitter.on('settings:permission_mode_updated', withChannel(onPermissionModeUpdated));
  emitter.on('settings:set_model', withError(withChannel(handleSetModel)));
  emitter.on('settings:set_permission_mode', withError(withChannel(handleSetPermissionMode)));
  emitter.on('settings:set_thinking_level', withError(withChannel(handleSetThinkingLevel)));
  emitter.on('settings:set_proactive', withChannel(handleSetProactive));
  emitter.on('settings:set_remote_control', withChannel(handleSetRemoteControl));
  emitter.on('settings:apply', withError(withChannel(handleApply)));
  emitter.on('settings:state', withError(withChannel(handleState)));
  emitter.on('settings:refresh_usage', handleRefreshUsage);
}
