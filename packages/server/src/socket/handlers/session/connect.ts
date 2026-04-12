import type { ControlResponse, SessionInitPayload, SessionLaunchPayload } from '@code-quest/shared';
import {
  channelExitPayloadSchema,
  controlInitResponseSchema,
  sessionJoinPayloadSchema,
  sessionLaunchPayloadSchema,
} from '@code-quest/shared';
import { z } from 'zod';
import { config } from '../../../config.ts';
import { logger } from '../../../logger.ts';
import type { HandlerContext } from '../../../types.ts';
import type { Channel } from '../../channel.ts';
import { withChannel } from '../../channel-emitter.ts';
import { DEFAULT_THINKING_TOKENS } from '../../schemas.ts';
import type { SocketCallback, TypedSocket } from '../../types.ts';
import { errMsg, pickDefined } from '../../utils/helpers.ts';

const initResponseResultSchema = z.object({
  slashCommands: z.array(z.string()).optional(),
  models: z.array(z.unknown()).optional(),
  account: z.record(z.string(), z.unknown()).optional(),
});
type InitResponseResult = z.infer<typeof initResponseResultSchema>;

function buildSessionInitPayload(channel: Channel): SessionInitPayload {
  const meta = channel.metaCache;
  return {
    channelId: channel.channelId,
    sessionId: channel.sessionId ?? '',
    ...pickDefined({
      model: meta.model,
      tools: meta.tools,
      permissionMode: meta.permissionMode,
      fastModeState: meta.fastModeState,
      mcpServers: meta.mcpServers,
      slashCommands: meta.slashCommands,
    }),
    config: { ...channel.sessionConfig },
  };
}

export function create({
  channelManager,
  settingsStore,
  sessionStore,
  sessionHistory,
  emitter,
}: Pick<
  HandlerContext,
  'channelManager' | 'settingsStore' | 'sessionStore' | 'sessionHistory' | 'emitter'
>): void {
  async function applyPerLaunchSettings(
    channel: Channel,
    parsed: Pick<SessionLaunchPayload, 'model' | 'permissionMode' | 'thinkingLevel'>,
  ): Promise<void> {
    if (parsed.model) {
      await channel
        .sendRequest('settings:set_model', { model: parsed.model })
        .catch((e) => logger.warn({ err: e }, 'Failed to set model'));
    }
    if (parsed.permissionMode) {
      await channel
        .sendRequest('settings:set_permission_mode', { mode: parsed.permissionMode })
        .catch((e) => logger.warn({ err: e }, 'Failed to set permission mode'));
    }
    if (parsed.thinkingLevel) {
      await channel
        .sendRequest('settings:set_thinking_level', {
          tokens: parsed.thinkingLevel === 'off' ? 0 : DEFAULT_THINKING_TOKENS,
        })
        .catch((e) => logger.warn({ err: e }, 'Failed to set thinking tokens'));
    }
  }

  async function handleInitResponse(initResult: ControlResponse): Promise<InitResponseResult> {
    const initResponse = controlInitResponseSchema.parse(initResult.response ?? {});
    const { commands, models, account } = initResponse;
    const slashCommands = Array.isArray(commands)
      ? [...new Set(commands.map((c) => c.name))]
      : undefined;

    if (models) {
      channelManager.cachedModels = models;
      await settingsStore.set(channelManager.provider, 'models', models);
      emitter.broadcastAll('app:models', { channelId: '', models });
    }

    if (account && Object.keys(account).length > 0) {
      const { email, subscriptionType, authMethod, organization } = account;
      emitter.broadcastAll('settings:update', {
        channelId: '',
        accountInfo: { email, subscriptionType, authMethod, organization },
      });
    }

    return { slashCommands, models, account };
  }

  function buildLaunchOpts(
    parsed: SessionLaunchPayload,
    resumeSessionId: string | undefined,
  ): { launchOptions: Record<string, unknown>; initOptions: Record<string, unknown> } {
    const launchOptions = {
      ...parsed.launchOptions,
      ...(resumeSessionId ? { resumeSessionId } : {}),
      ...(config.allowDangerouslySkipPermissions ? { allowDangerouslySkipPermissions: true } : {}),
    };
    const clientOpts = parsed.initOptions ?? {};
    const initOptions: Record<string, unknown> = {
      ...clientOpts,
      appendSystemPrompt: [clientOpts.appendSystemPrompt, config.systemPrompt]
        .filter(Boolean)
        .join('\n'),
    };
    return { launchOptions, initOptions };
  }

  async function finalizeAndNotify(
    channel: Channel,
    parsed: SessionLaunchPayload,
    initResult: ControlResponse,
    socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    await applyPerLaunchSettings(channel, parsed);
    const { slashCommands, models, account } = await handleInitResponse(initResult);

    channel.updateMetaCache({
      ...(parsed.model && { model: parsed.model }),
      ...(parsed.permissionMode && { permissionMode: parsed.permissionMode }),
      ...(slashCommands && { slashCommands }),
    });

    const channelId = channel.channelId;
    socket?.emit('session:init', { ...buildSessionInitPayload(channel) });
    if (channelManager.cachedModels) {
      socket?.emit('app:models', { channelId: '', models: channelManager.cachedModels });
    }

    callback?.({ channelId, slashCommands, models, account });
    emitter.broadcastAll('session:created', { channelId, cwd: channel.cwd });

    if (parsed.initialPrompt) {
      channel.sendMessage(parsed.initialPrompt);
    }
  }

  async function handleLaunch(
    _ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    let resumeSessionId: string | undefined;
    try {
      const parsed = sessionLaunchPayloadSchema.parse(payload);
      resumeSessionId = parsed.resume;
      const channelId = parsed.channelId ?? crypto.randomUUID();
      const { launchOptions, initOptions } = buildLaunchOpts(parsed, resumeSessionId);
      const { channel, initResult } = await channelManager.create(channelId, {
        launchOptions,
        initOptions,
        cwd: parsed.cwd,
        onBeforeSpawn: (ch) => {
          if (socket) channelManager.addSocketToChannel(ch, socket);
        },
      });

      // persist is deferred to onSessionInit (session:init may arrive after control_response)

      await finalizeAndNotify(channel, parsed, initResult, socket, callback);
    } catch (err) {
      logger.error({ err }, 'Failed to create session');
      const message = errMsg(err, 'Failed to create session');
      if (resumeSessionId && message.includes('No conversation found')) {
        await sessionStore.updateStatus(resumeSessionId, 'dead').catch(() => {});
        emitter.broadcastAll('session:dead', { channelId: resumeSessionId });
        return;
      }
      callback?.({ channelId: '', error: message });
    }
  }

  async function replayAndEmitState(
    channel: Channel,
    socket?: TypedSocket,
  ): Promise<{ events: unknown[] }> {
    const channelId = channel.channelId;
    channelManager.ensureBound(channel);

    const replaySessionId = await sessionHistory.resolveSessionId(channelId);
    if (socket) {
      await sessionHistory.replayPendingControlRequests(socket, channelId, replaySessionId);
    }

    socket?.emit('session:init', { ...buildSessionInitPayload(channel) });
    if (channelManager.cachedModels) {
      socket?.emit('app:models', { channelId: '', models: channelManager.cachedModels });
    }

    const events = await sessionHistory.getSessionHistory(channelId);
    return { events };
  }

  async function handleJoin(
    _ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { channelId } = sessionJoinPayloadSchema.parse(payload);
      const existingChannel = channelManager.get(channelId);
      const isAlive = existingChannel && !existingChannel.exited;

      if (!isAlive) {
        try {
          await channelManager.join(channelId);
        } catch (err) {
          logger.debug(err, 'failed to join channel during connect');
          callback?.({ error: 'Session not found' });
          return;
        }
      }

      const channel = channelManager.get(channelId);
      if (!channel) {
        callback?.({ error: 'Session not found' });
        return;
      }

      if (socket) channelManager.addSocketToChannel(channel, socket);

      const { events } = await replayAndEmitState(channel, socket);
      const state = channel.isProcessing ? 'busy' : 'idle';
      callback?.({ channelId, state, meta: channel.metaCache ?? {}, events, cwd: channel.cwd });
    } catch (err) {
      callback?.({ error: errMsg(err, 'Failed to join session') });
    }
  }

  function onSessionInit(ch: Channel, _payload: unknown): void {
    const channelId = ch.channelId;
    channelManager.broadcastSessionState(channelId, 'busy');

    // Persist when session:init arrives (sessionId now available)
    if (ch.sessionId) {
      const parentId = ch.parentId;
      sessionStore
        .persist({
          id: channelId,
          sessionId: ch.sessionId,
          provider: channelManager.provider,
          command: channelManager.runnerCommand,
          args: JSON.stringify(channelManager.runnerArgs),
          cwd: ch.cwd,
          mode: 'interactive',
          role: 'chat',
          ...(parentId ? { parentId } : {}),
          createdAt: new Date().toISOString(),
        })
        .catch((err) => logger.error({ err }, 'Failed to persist session'));
    }
  }

  function onChannelExit(ch: Channel, payload: unknown): void {
    const { code: _code } = channelExitPayloadSchema.parse(payload);
    channelManager.broadcastSessionState(ch.channelId, 'exited');
    ch.resetSessionConfig();
    emitter.emit(ch.channelId, 'session:closed', {
      channelId: ch.channelId,
      ...(ch.lastError ? { error: ch.lastError } : {}),
    });
  }

  emitter.on('session:init', withChannel(onSessionInit));
  emitter.on('channel:exit', withChannel(onChannelExit));
  emitter.on('session:launch', handleLaunch);
  emitter.on('session:join', handleJoin);
}
