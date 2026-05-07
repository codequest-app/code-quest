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
import type { SocketCallback, TypedSocket } from '@code-quest/shared/node';
import { errMsg } from '@code-quest/shared/node';
import type { z } from 'zod';
import { logger } from '../../logger.ts';
import type { HandlerContext } from '../../types.ts';
import type { Channel } from '../channel.ts';
import { BROADCAST_CHANNEL_ID, withChannel, withError } from '../channel-emitter.ts';
import { DEFAULT_THINKING_TOKENS } from '../schemas.ts';
import { pickDefined } from '../utils/helpers.ts';
import { err, ok } from '../utils/rpc.ts';

export const SETTINGS_STATE_KEYS = [
  'model',
  'permissionMode',
  'thinkingLevel',
  'effortLevel',
] as const;

export function create({
  autoMode,
  channelManager,
  settingsStore,
  usageTracker,
  emitter,
}: Pick<
  HandlerContext,
  'autoMode' | 'channelManager' | 'settingsStore' | 'usageTracker' | 'emitter'
>): void {
  function broadcastModels(): void {
    const raw = channelManager.cachedModels;
    if (!raw) return;
    const models = autoMode
      ? raw
      : raw.flatMap((m) => {
          const parsed = modelInfoSchema.safeParse(m);
          if (!parsed.success) return [];
          if (!parsed.data.supportsAutoMode) return [m];
          return [{ ...parsed.data, supportsAutoMode: false }];
        });
    emitter.broadcastAll(EVENTS.app.models, { channelId: BROADCAST_CHANNEL_ID, models });
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
    run: async (ch, { channelId, model }) => {
      await ch.sendRequest(EVENTS.settings.set_model, { model });
      ch.updateSessionConfig({ model });
      await settingsStore
        .set(ch.provider, 'model', model)
        .catch((e) => logger.warn({ err: e }, 'Failed to persist model to settings store'));
      emitter.emit(channelId, EVENTS.settings.update, { channelId, model });
      broadcastModels();
    },
  });

  const handleSetPermissionMode = createSettingHandler({
    schema: settingsSetPermissionModePayloadSchema,
    errorMsg: 'Failed to set permission mode',
    run: async (ch, { channelId, mode }) => {
      await ch.sendRequest(EVENTS.settings.set_permission_mode, { mode });
      ch.updateSessionConfig({ permissionMode: mode });
      await settingsStore
        .set(ch.provider, 'permissionMode', mode)
        .catch((e) =>
          logger.warn({ err: e }, 'Failed to persist permissionMode to settings store'),
        );
      emitter.emit(channelId, EVENTS.settings.update, { channelId, permissionMode: mode });
    },
  });

  const handleSetThinkingLevel = createSettingHandler({
    schema: settingsSetThinkingLevelPayloadSchema,
    errorMsg: 'Failed to set thinking level',
    run: async (ch, { channelId, thinkingLevel, thinkingDisplay }) => {
      await ch.sendRequest(EVENTS.settings.set_thinking_level, {
        tokens: thinkingLevel === 'off' ? 0 : DEFAULT_THINKING_TOKENS,
      });
      await settingsStore.set(ch.provider, 'thinkingLevel', thinkingLevel);
      if (thinkingDisplay != null) {
        await settingsStore.set(ch.provider, 'thinkingDisplay', thinkingDisplay);
      }
      emitter.broadcastAll(EVENTS.settings.update, {
        channelId,
        thinkingLevel,
        ...(thinkingDisplay != null ? { thinkingDisplay } : {}),
      });
    },
  });

  const handleSetProactive = createSettingHandler({
    schema: settingsSetProactivePayloadSchema,
    errorMsg: 'Failed to set proactive mode',
    run: async (ch, { channelId, enabled }) => {
      await ch.sendRequest(EVENTS.settings.set_proactive, { enabled });
      emitter.broadcastAll(EVENTS.settings.update, {
        channelId,
        fastModeState: enabled ? 'on' : 'off',
      });
    },
  });

  const handleSetRemoteControl = createSettingHandler({
    schema: settingsSetRemoteControlPayloadSchema,
    errorMsg: 'Failed to set remote control',
    run: async (ch, { enabled }) => {
      // Fire-and-forget — remote_control is a best-effort notification.
      ch.sendRequest('settings:remote_control', { enabled }).catch((err) =>
        logger.debug({ err }, 'sendRequest failed'),
      );
    },
  });

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
        ...(await settingsStore.getMany(ch.provider, [...SETTINGS_STATE_KEYS])),
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
      channelId: BROADCAST_CHANNEL_ID,
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

  function onCliSettingsUpdate<InputSchema extends z.ZodTypeAny>(
    ch: Channel,
    payload: unknown,
    inputSchema: InputSchema,
    apply: (ch: Channel, input: z.infer<InputSchema>) => void,
  ): void {
    const { requestId, input } = settingsUpdatedPayloadSchema.parse(payload);
    apply(ch, inputSchema.parse(input ?? {}));
    ch.respondToRequest(requestId, { subtype: 'success' });
    channelManager.broadcastSessionState(ch.channelId, 'busy');
  }

  const onModelUpdated = (ch: Channel, payload: unknown) =>
    onCliSettingsUpdate(ch, payload, serverActionModelSchema, (c, { model }) =>
      c.updateSessionConfig({ model }),
    );

  const onPermissionModeUpdated = (ch: Channel, payload: unknown) =>
    onCliSettingsUpdate(ch, payload, serverActionModeSchema, (c, { mode }) =>
      c.updateSessionConfig({ permissionMode: mode }),
    );

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
