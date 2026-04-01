import type { ChatCreatePayload, ControlResponse } from '@code-quest/shared';
import { chatCreateSchema, chatJoinSchema, controlInitResponseSchema } from '@code-quest/shared';
import { config } from '../../../config.ts';
import { logger } from '../../../logger.ts';
import type { SessionStore } from '../../../services/session-store.ts';
import type { SettingsStore } from '../../../services/settings-store.ts';
import type { Channel } from '../../channel.ts';
import type { ChannelEventRouter } from '../../channel-event-router.ts';
import type { ChannelManager } from '../../channel-manager.ts';
import {
  DEFAULT_THINKING_TOKENS,
  type InitResponseResult,
  initResponseResultSchema,
} from '../../schemas.ts';
import type { SessionHistory } from '../../session-history.ts';
import type { SocketCallback, SocketHandler, TypedSocket } from '../../types.ts';
import { errMsg } from '../../utils/helpers.ts';
import { persistNewSession } from './persist.ts';

export function create(
  channelManager: ChannelManager,
  settingsStore: SettingsStore,
  sessionStore: SessionStore,
  sessionHistory: SessionHistory,
): SocketHandler {
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
    socket: TypedSocket,
    payload: unknown,
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
        onBeforeSpawn: (ch) => channelManager.addSocketToChannel(ch, socket),
      });

      if (channel.sessionId) {
        persistNewSession(
          { channelManager, sessionStore },
          { channelId, sessionId: channel.sessionId },
        );
      }

      await applyPerLaunchSettings(channel, parsed);
      const { slashCommands, models, account } = await handleInitResponse(initResult);

      channel.updateMetaCache({
        ...(parsed.model && { model: parsed.model }),
        ...(parsed.permissionMode && { permissionMode: parsed.permissionMode }),
        ...(slashCommands && { slashCommands }),
      });

      socket.emit('session:init', { ...channel.buildSessionInitPayload() });
      if (channelManager.cachedModels) {
        socket.emit('app:models', { channelId: '', models: channelManager.cachedModels });
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
    socket: TypedSocket,
    payload: unknown,
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

      channelManager.addSocketToChannel(channel, socket);

      if (!channel.isWired) {
        channel.wireRunner(channelManager.channelHooks);
      }

      const replaySessionId = await sessionHistory.resolveSessionId(channelId);
      await sessionHistory.replayPendingControlRequests(socket, channelId, replaySessionId);

      socket.emit('session:init', { ...channel.buildSessionInitPayload() });
      if (channelManager.cachedModels) {
        socket.emit('app:models', { channelId: '', models: channelManager.cachedModels });
      }

      const events = await sessionHistory.getSessionHistory(channelId);
      const state = channel.isProcessing ? 'busy' : 'idle';
      callback?.({ channelId, state, meta: channel.metaCache ?? {}, events });
    } catch (err) {
      callback?.({ error: errMsg(err, 'Failed to join session') });
    }
  }

  function onSessionInit(channelId: string): void {
    channelManager.broadcastSessionState(channelId, 'busy');
  }

  function onChannelExit(channelId: string, ch: Channel): void {
    channelManager.broadcastSessionState(channelId, 'exited');
    ch.resetSessionState();
    ch.emit('session:closed', {
      channelId,
      ...(ch.lastError ? { error: ch.lastError } : {}),
    });
  }

  return {
    register(socket: TypedSocket) {
      socket.on('session:launch', (p, cb) => handleLaunch(socket, p, cb));
      socket.on('session:join', (p, cb) => handleJoin(socket, p, cb));
    },
    subscribe(router: ChannelEventRouter) {
      router.onEvent('session:init', (cid) => onSessionInit(cid));
      router.onExit((cid, ch) => onChannelExit(cid, ch));
    },
  };
}
