import type { ChatCreatePayload, ControlResponse } from '@code-quest/shared';
import {
  chatCreateSchema,
  chatJoinSchema,
  chatKillSchema,
  controlInitResponseSchema,
  sessionResumePayloadSchema,
} from '@code-quest/shared';
import { z } from 'zod';
import { config } from '../../../config.ts';
import { logger } from '../../../logger.ts';
import type { Channel } from '../../channel.ts';
import type { HandlerContext } from '../../context.ts';
import type { TypedSocket } from '../../types.ts';
import { errMsg } from '../../types.ts';
/** Default max thinking tokens when thinking is enabled (matches CLI default). */
export const DEFAULT_THINKING_TOKENS = 31999;

export function persistNewSession(
  ctx: HandlerContext,
  opts: { channelId: string; sessionId: string; parentId?: string },
): void {
  ctx.sessionStore
    .persist({
      id: opts.channelId,
      sessionId: opts.sessionId,
      provider: ctx.channelManager.provider,
      command: ctx.runnerFactory.command,
      args: JSON.stringify(ctx.runnerFactory.args),
      cwd: process.cwd(),
      mode: 'interactive',
      role: 'chat',
      ...(opts.parentId ? { parentId: opts.parentId } : {}),
      createdAt: new Date().toISOString(),
    })
    .catch((err) => logger.error({ err }, 'Failed to persist session'));
}

const initResponseResultSchema = z.object({
  slashCommands: z.array(z.string()).optional(),
  models: z.array(z.unknown()).optional(),
  account: z.record(z.string(), z.unknown()).optional(),
});
type InitResponseResult = z.infer<typeof initResponseResultSchema>;

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

async function handleInitResponse(
  ctx: HandlerContext,
  initResult: ControlResponse,
): Promise<InitResponseResult> {
  const initResponse = controlInitResponseSchema.parse(initResult.response ?? {});
  const { commands, models, account } = initResponse;
  const slashCommands = Array.isArray(commands)
    ? [...new Set(commands.map((c) => c.name))]
    : undefined;

  if (models) {
    ctx.cachedModels = models;
    await ctx.settingsStore.set(ctx.channelManager.provider, 'models', models);
    ctx.io?.emit('app:models', { channelId: '', models });
  }

  if (account && Object.keys(account).length > 0) {
    const { email, subscriptionType, authMethod, organization } = account;
    ctx.io?.emit('settings:update', {
      channelId: '',
      accountInfo: { email, subscriptionType, authMethod, organization },
    });
  }

  return { slashCommands, models, account };
}

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on('session:launch', async (payload, callback) => {
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
      const hooks = ctx.buildChannelHooks(channelId);
      const { channel, initResult } = await ctx.channelManager.create(channelId, {
        hooks,
        launchOptions: launchOpts,
        initOptions: initInput,
        onBeforeSpawn: (ch) => ctx.addSocketToChannel(ch, socket),
      });

      if (channel.sessionId) {
        persistNewSession(ctx, { channelId, sessionId: channel.sessionId });
      }

      await applyPerLaunchSettings(channel, parsed);
      const { slashCommands, models, account } = await handleInitResponse(ctx, initResult);

      channel.updateMetaCache({
        ...(parsed.model && { model: parsed.model }),
        ...(parsed.permissionMode && { permissionMode: parsed.permissionMode }),
        ...(slashCommands && { slashCommands }),
      });

      socket.emit('session:init', { ...channel.buildSessionInitPayload() });
      if (ctx.cachedModels) {
        socket.emit('app:models', { channelId: '', models: ctx.cachedModels });
      }

      ctx.io?.emit('session:created', { channelId });
      callback?.({ channelId, slashCommands, models, account });

      if (parsed.initialPrompt) {
        channel.runner.sendMessage(parsed.initialPrompt);
      }
    } catch (err) {
      logger.error({ err }, 'Failed to create session');
      const message = errMsg(err, 'Failed to create session');
      if (resumeSessionId && message.includes('No conversation found')) {
        await ctx.sessionStore.updateStatus(resumeSessionId, 'dead').catch(() => {});
        ctx.io?.emit('session:dead', { channelId: resumeSessionId });
        return;
      }
      callback?.({ channelId: '', error: message });
    }
  });

  socket.on('session:join', async (payload, callback) => {
    try {
      const { channelId } = chatJoinSchema.parse(payload);
      const existingChannel = ctx.channelManager.get(channelId);
      const isAlive = existingChannel && !existingChannel.exited;

      if (!isAlive) {
        const hooks = ctx.buildChannelHooks(channelId);
        try {
          await ctx.channelManager.join(channelId, { hooks });
        } catch {
          callback?.({ error: 'Session not found' });
          return;
        }
      }

      const channel = ctx.channelManager.get(channelId);
      if (!channel) {
        callback?.({ error: 'Session not found' });
        return;
      }

      ctx.addSocketToChannel(channel, socket);

      if (!channel.isWired) {
        const hooks = ctx.buildChannelHooks(channelId);
        channel.wireRunner(hooks);
      }

      const replaySessionId = await ctx.resolveSessionId(channelId);
      await channel.replayPendingControlRequests(
        socket,
        (sid) => ctx.getPendingReplayEvents(sid),
        replaySessionId,
      );

      socket.emit('session:init', { ...channel.buildSessionInitPayload() });
      if (ctx.cachedModels) {
        socket.emit('app:models', { channelId: '', models: ctx.cachedModels });
      }

      const events = await ctx.getSessionHistory(channelId);
      const state = channel.isProcessing ? 'busy' : 'idle';
      callback?.({ channelId, state, meta: channel.metaCache ?? {}, events });
    } catch (err) {
      callback?.({ error: errMsg(err, 'Failed to join session') });
    }
  });

  socket.on('session:close', (payload) => {
    try {
      const { channelId } = chatKillSchema.parse(payload);
      const ch = ctx.channelManager.get(channelId);
      if (ch) {
        ch.runner.kill();
        ctx.io?.emit('session:dead', { channelId });
      }
    } catch {
      // ignore
    }
  });

  socket.on('session:resume', (payload) => {
    try {
      const { channelId } = sessionResumePayloadSchema.parse(payload);
      ctx.io?.emit('session:resume', { channelId });
    } catch {
      // ignore invalid payload
    }
  });
}
