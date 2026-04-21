import {
  contextUsageDataSchema,
  EVENTS,
  modelInfoSchema,
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
import { config } from '../../config.ts';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { withChannel, withError } from '../channel-emitter.ts';
import { DEFAULT_THINKING_TOKENS } from '../schemas.ts';
import type { SocketCallback, TypedSocket } from '../types.ts';
import { errMsg, pickDefined } from '../utils/helpers.ts';
import { err, ok } from '../utils/rpc.ts';

export function create({
  channelManager,
  settingsStore,
  usageTracker,
  emitter,
}: Pick<HandlerContext, 'channelManager' | 'settingsStore' | 'usageTracker' | 'emitter'>): void {
  function broadcastModels(): void {
    const raw = channelManager.cachedModels;
    if (!raw) return;
    const models = config.autoMode
      ? raw
      : raw.flatMap((m) => {
          const parsed = modelInfoSchema.safeParse(m);
          if (!parsed.success) return [];
          if (!parsed.data.supportsAutoMode) return [m];
          return [{ ...parsed.data, supportsAutoMode: false }];
        });
    emitter.broadcastAll(EVENTS.app.models, { channelId: '', models });
  }
  type SettingHandler<T> = {
    schema: { parse(p: unknown): T };
    run: (ch: Channel, parsed: T) => void | Promise<void>;
    errorMsg: string;
  };
  function createSettingHandler<T>({ schema, run, errorMsg }: SettingHandler<T>) {
    return async (
      ch: Channel,
      payload: unknown,
      _socket?: TypedSocket,
      callback?: SocketCallback,
    ): Promise<void> => {
      try {
        const parsed = schema.parse(payload);
        await run(ch, parsed);
        callback?.(ok({}));
      } catch (e) {
        callback?.(err(errMsg(e, errorMsg)));
      }
    };
  }

  const handleSetModel = createSettingHandler({
    schema: settingsSetModelPayloadSchema,
    errorMsg: 'Failed to set model',
    run: async (ch, { model }) => {
      await ch.sendRequest(EVENTS.settings.set_model, { model });
      await settingsStore
        .set(ch.provider, 'model', model)
        .catch((e) => logger.warn({ err: e }, 'Failed to persist model to settings store'));
      broadcastModels();
    },
  });

  const handleSetPermissionMode = createSettingHandler({
    schema: settingsSetPermissionModePayloadSchema,
    errorMsg: 'Failed to set permission mode',
    run: async (ch, { channelId, mode }) => {
      await ch.sendRequest(EVENTS.settings.set_permission_mode, { mode });
      ch.updateSessionConfig({ permissionMode: mode });
      await settingsStore.set(ch.provider, 'permissionMode', mode);
      emitter.broadcastAll(EVENTS.settings.update, { channelId, initialPermissionMode: mode });
    },
  });

  const handleSetThinkingLevel = createSettingHandler({
    schema: settingsSetThinkingLevelPayloadSchema,
    errorMsg: 'Failed to set thinking level',
    run: async (ch, { channelId, thinkingLevel }) => {
      await ch.sendRequest(EVENTS.settings.set_thinking_level, {
        tokens: thinkingLevel === 'off' ? 0 : DEFAULT_THINKING_TOKENS,
      });
      await settingsStore.set(ch.provider, 'thinkingLevel', thinkingLevel);
      emitter.broadcastAll(EVENTS.settings.update, { channelId, thinkingLevel });
    },
  });

  async function handleSetProactive(ch: Channel, payload: unknown): Promise<void> {
    try {
      const { channelId, enabled } = settingsSetProactivePayloadSchema.parse(payload);
      await ch.sendRequest(EVENTS.settings.set_proactive, { enabled });
      emitter.broadcastAll(EVENTS.settings.update, {
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
      ch.sendRequest('settings:remote_control', { enabled }).catch((err) =>
        logger.debug({ err }, 'sendRequest failed'),
      );
    } catch (err) {
      logger.warn({ err }, 'Failed to set remote control');
    }
  }

  const handleApply = createSettingHandler({
    schema: settingsApplyPayloadSchema,
    errorMsg: 'Invalid payload',
    run: async (ch, { channelId, settings }) => {
      await ch.sendRequest(EVENTS.settings.apply, { settings });
      if (settings.effortLevel != null) {
        await settingsStore.set(ch.provider, 'effortLevel', String(settings.effortLevel));
        emitter.broadcastAll(EVENTS.settings.update, {
          channelId,
          effort: String(settings.effortLevel),
        });
        broadcastModels();
      }
    },
  });

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
      callback?.(ok({ state }));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to get state')));
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
        const parsed = contextUsageDataSchema.safeParse(resp.response);
        if (parsed.success) {
          contextUsage = parsed.data;
        }
      } catch (err) {
        logger.debug({ err }, 'CLI may not support get_context_usage');
      }
    }

    socket.emit(EVENTS.settings.usage, {
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
    channelManager.broadcastSessionState(ch.channelId, 'busy');
  }

  function onPermissionModeUpdated(ch: Channel, payload: unknown): void {
    const { requestId, input } = settingsUpdatedPayloadSchema.parse(payload);
    const { mode } = serverActionModeSchema.parse(input ?? {});
    ch.updateSessionConfig({ permissionMode: mode });
    ch.respondToRequest(requestId, { subtype: 'success' });
    channelManager.broadcastSessionState(ch.channelId, 'busy');
  }

  emitter.on(EVENTS.settings.get_settings, withChannel(onGetSettings));
  emitter.on(EVENTS.settings.model_updated, withChannel(onModelUpdated));
  emitter.on(EVENTS.settings.permission_mode_updated, withChannel(onPermissionModeUpdated));
  emitter.on(EVENTS.settings.set_model, withError(withChannel(handleSetModel)));
  emitter.on(EVENTS.settings.set_permission_mode, withError(withChannel(handleSetPermissionMode)));
  emitter.on(EVENTS.settings.set_thinking_level, withError(withChannel(handleSetThinkingLevel)));
  emitter.on(EVENTS.settings.set_proactive, withChannel(handleSetProactive));
  emitter.on(EVENTS.settings.set_remote_control, withChannel(handleSetRemoteControl));
  emitter.on(EVENTS.settings.apply, withError(withChannel(handleApply)));
  emitter.on(EVENTS.settings.state, withError(withChannel(handleState)));
  emitter.on(EVENTS.settings.refresh_usage, handleRefreshUsage);
}
