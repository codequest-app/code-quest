import type { ChatCreatePayload, ControlResponse, SessionInitPayload } from '@code-quest/shared';
import { chatCreateSchema, chatJoinSchema, controlInitResponseSchema } from '@code-quest/shared';
import { z } from 'zod';
import { config } from '../../../config.ts';
import { logger } from '../../../logger.ts';
import type { SessionStore } from '../../../services/session-store.ts';
import type { SettingsStore } from '../../../services/settings-store.ts';
import type { Channel } from '../../channel.ts';
import { type ChannelEmitter, withChannel } from '../../channel-emitter.ts';
import type { ChannelManager } from '../../channel-manager.ts';
import { DEFAULT_THINKING_TOKENS } from '../../schemas.ts';
import type { SessionHistory } from '../../session-history.ts';
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
    channelId: channel.id,
    sessionId: channel.sessionId ?? '',
    ...pickDefined({
      model: meta.model,
      tools: meta.tools,
      permissionMode: meta.permissionMode,
      fastModeState: meta.fastModeState,
      mcpServers: meta.mcpServers,
      slashCommands: meta.slashCommands,
    }),
    config: { ...channel.sessionState },
  };
}

export function create(
  channelManager: ChannelManager,
  settingsStore: SettingsStore,
  sessionStore: SessionStore,
  sessionHistory: SessionHistory,
  emitter: ChannelEmitter,
): void {
  async function applyPerLaunchSettings(
    channel: Channel,
    parsed: Pick<ChatCreatePayload, 'model' | 'permissionMode' | 'thinkingLevel' | 'cwd'>,
  ): Promise<void> {
    if (parsed.model) {
      await channel
        .sendControlRequest('set_model', { model: parsed.model })
        .catch((e) => logger.warn({ err: e }, 'Failed to set model'));
    }
    if (parsed.permissionMode) {
      await channel
        .sendControlRequest('set_permission_mode', { mode: parsed.permissionMode })
        .catch((e) => logger.warn({ err: e }, 'Failed to set permission mode'));
    }
    if (parsed.thinkingLevel) {
      await channel
        .sendControlRequest('set_max_thinking_tokens', {
          tokens: parsed.thinkingLevel === 'off' ? 0 : DEFAULT_THINKING_TOKENS,
        })
        .catch((e) => logger.warn({ err: e }, 'Failed to set thinking tokens'));
    }
    if (parsed.cwd) {
      channel.updateSessionState({ cwd: parsed.cwd });
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
      channelManager.broadcastModels(models);
    }

    if (account && Object.keys(account).length > 0) {
      const { email, subscriptionType, authMethod, organization } = account;
      channelManager.broadcastSettingsUpdate('', {
        accountInfo: { email, subscriptionType, authMethod, organization },
      });
    }

    return { slashCommands, models, account };
  }

  async function handleLaunch(
    _ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    let resumeSessionId: string | undefined;
    try {
      const parsed = chatCreateSchema.parse(payload);
      resumeSessionId = parsed.resume;
      const channelId = parsed.channelId ?? crypto.randomUUID();
      const launchOpts = {
        ...parsed.launchOptions,
        ...(resumeSessionId ? { resumeSessionId } : {}),
        ...(config.allowDangerouslySkipPermissions
          ? { allowDangerouslySkipPermissions: true }
          : {}),
      };
      const clientOpts = parsed.initOptions ?? {};
      const initInput: Record<string, unknown> = {
        ...clientOpts,
        appendSystemPrompt: [clientOpts.appendSystemPrompt, config.systemPrompt]
          .filter(Boolean)
          .join('\n'),
      };
      const { channel, initResult } = await channelManager.create(channelId, {
        launchOptions: launchOpts,
        initOptions: initInput,
        onBeforeSpawn: (ch) => {
          if (socket) channelManager.addSocketToChannel(ch, socket);
        },
      });

      // persist is deferred to onSessionInit (session:init may arrive after control_response)

      await applyPerLaunchSettings(channel, parsed);
      const { slashCommands, models, account } = await handleInitResponse(initResult);

      channel.updateMetaCache({
        ...(parsed.model && { model: parsed.model }),
        ...(parsed.permissionMode && { permissionMode: parsed.permissionMode }),
        ...(slashCommands && { slashCommands }),
      });

      socket?.emit('session:init', { ...buildSessionInitPayload(channel) });
      if (channelManager.cachedModels) {
        socket?.emit('app:models', { channelId: '', models: channelManager.cachedModels });
      }

      channelManager.broadcastSessionCreated(channelId);
      callback?.({ channelId, slashCommands, models, account });

      if (parsed.initialPrompt) {
        channel.sendMessage(parsed.initialPrompt);
      }
    } catch (err) {
      logger.error({ err }, 'Failed to create session');
      const message = errMsg(err, 'Failed to create session');
      if (resumeSessionId && message.includes('No conversation found')) {
        await sessionStore.updateStatus(resumeSessionId, 'dead').catch(() => {});
        channelManager.broadcastSessionDead(resumeSessionId);
        return;
      }
      callback?.({ channelId: '', error: message });
    }
  }

  async function handleJoin(
    _ch: Channel | null,
    payload: unknown,
    socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { channelId } = chatJoinSchema.parse(payload);
      const existingChannel = channelManager.get(channelId);
      const isAlive = existingChannel && !existingChannel.exited;

      if (!isAlive) {
        try {
          await channelManager.join(channelId);
        } catch {
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
      const state = channel.isProcessing ? 'busy' : 'idle';
      callback?.({ channelId, state, meta: channel.metaCache ?? {}, events });
    } catch (err) {
      callback?.({ error: errMsg(err, 'Failed to join session') });
    }
  }

  function onSessionInit(ch: Channel, _payload: unknown): void {
    const channelId = ch.id;
    channelManager.broadcastSessionState(channelId, 'busy');

    // Persist when session:init arrives (sessionId now available)
    const channel = ch;
    if (channel.sessionId) {
      const parentId = channel.sessionState.parentId;
      sessionStore
        .persist({
          id: channelId,
          sessionId: channel.sessionId,
          provider: channelManager.provider,
          command: channelManager.runnerCommand,
          args: JSON.stringify(channelManager.runnerArgs),
          cwd: process.cwd(),
          mode: 'interactive',
          role: 'chat',
          ...(parentId ? { parentId } : {}),
          createdAt: new Date().toISOString(),
        })
        .catch((err) => logger.error({ err }, 'Failed to persist session'));
    }
  }

  function onChannelExit(ch: Channel, payload: unknown): void {
    const { code: _code } = payload as { code: number | null };
    channelManager.broadcastSessionState(ch.id, 'exited');
    ch.resetSessionState();
    emitter.emit(ch.id, 'session:closed', {
      channelId: ch.id,
      ...(ch.lastError ? { error: ch.lastError } : {}),
    });
  }

  emitter.on('session:init', withChannel(onSessionInit));
  emitter.on('channel:exit', withChannel(onChannelExit));
  emitter.on('session:launch', handleLaunch);
  emitter.on('session:join', handleJoin);
}
