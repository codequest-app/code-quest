import {
  chatCreateSchema,
  chatGenerateSessionTitleSchema,
  chatJoinSchema,
  chatKillSchema,
  sessionDeleteSchema,
  sessionForkSchema,
  sessionGetSchema,
  sessionListRemoteSchema,
  sessionListSchema,
  sessionRenameSchema,
  sessionResumePayloadSchema,
  sessionTeleportSchema,
  sessionUpdateStateSchema,
} from '@code-quest/shared';
import { config } from '../../config.ts';
import type { HandlerContext, TypedSocket } from '../handler-context.ts';
import { errMsg } from '../handler-context.ts';
import { cliInitResponseSchema } from './cli-response-schemas.ts';
import { DEFAULT_THINKING_TOKENS, execGit } from './helpers.ts';

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

      // Persist session record (sessionId available after init)
      if (channel.sessionId) {
        ctx.sessionStore
          .persist({
            id: channelId,
            sessionId: channel.sessionId,
            provider: ctx.channelManager.provider,
            command: ctx.runnerFactory.command,
            args: JSON.stringify(ctx.runnerFactory.args),
            cwd: process.cwd(),
            mode: 'interactive',
            role: 'chat',
            createdAt: new Date().toISOString(),
          })
          .catch((err) => console.error('Failed to persist session:', err));
      }

      // Apply per-launch settings if provided
      if (parsed.model) {
        await channel.sendControlRequest('set_model', { model: parsed.model }).catch(() => {});
      }
      if (parsed.permissionMode) {
        await channel
          .sendControlRequest('set_permission_mode', {
            mode: parsed.permissionMode,
          })
          .catch(() => {});
      }
      if (parsed.thinkingLevel) {
        await channel
          .sendControlRequest('set_max_thinking_tokens', {
            tokens: parsed.thinkingLevel === 'off' ? 0 : DEFAULT_THINKING_TOKENS,
          })
          .catch(() => {});
      }
      if (parsed.cwd) {
        channel.updateSessionState({ cwd: parsed.cwd });
      }

      // Extract data from initialize response
      const initResponse = cliInitResponseSchema.safeParse(initResult.response);
      const commands = initResponse.success ? initResponse.data.commands : undefined;
      const slashCommands = Array.isArray(commands)
        ? [...new Set(commands.map((c) => c.name))]
        : undefined;
      const models = initResponse.success ? initResponse.data.models : undefined;
      if (models) {
        ctx.cachedModels = models;
        await ctx.settingsStore.set(ctx.channelManager.provider, 'models', models);
        ctx.io?.emit('app:models', { channelId: '', models });
      }
      const account = initResponse.success ? initResponse.data.account : undefined;

      // Push account info from initialize response to all clients
      if (account && Object.keys(account).length > 0) {
        const { email, subscriptionType, authMethod, organization } = account;
        ctx.io?.emit('settings:update', {
          channelId: '',
          accountInfo: { email, subscriptionType, authMethod, organization },
        });
      }

      // Merge launch options into metaCache (wireRunner already set model/tools/etc from CLI init)
      channel.updateMetaCache({
        ...(parsed.model && { model: parsed.model }),
        ...(parsed.permissionMode && { permissionMode: parsed.permissionMode }),
        ...(slashCommands && { slashCommands }),
      });

      // Emit session:init with final metaCache to socket
      socket.emit('session:init', {
        ...channel.buildSessionInitPayload(),
      });
      if (ctx.cachedModels) {
        socket.emit('app:models', {
          channelId: '',
          models: ctx.cachedModels,
        });
      }

      ctx.io?.emit('session:created', { channelId });
      callback?.({ channelId, slashCommands, models, account });

      if (parsed.initialPrompt) {
        channel.runner.sendMessage(parsed.initialPrompt);
      }
    } catch (err) {
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

      // Emit session:init with final metaCache to socket
      socket.emit('session:init', {
        ...channel.buildSessionInitPayload(),
      });
      if (ctx.cachedModels) {
        socket.emit('app:models', {
          channelId: '',
          models: ctx.cachedModels,
        });
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

  socket.on('session:fork', async (payload, callback) => {
    try {
      const { forkedFromSession, resumeSessionAt, newSessionId } = sessionForkSchema.parse(payload);
      const events = await ctx.getSessionHistory(forkedFromSession);
      const hooks = ctx.buildChannelHooks(newSessionId);
      const { channel: forkChannel } = await ctx.channelManager.create(newSessionId, {
        hooks,
        launchOptions: { resumeSessionId: forkedFromSession },
        initOptions: resumeSessionAt ? { resumeSessionAt } : undefined,
        onBeforeSpawn: (ch) => ctx.addSocketToChannel(ch, socket),
      });

      // Persist forked session with parentId
      if (forkChannel.sessionId) {
        ctx.sessionStore
          .persist({
            id: newSessionId,
            sessionId: forkChannel.sessionId,
            provider: ctx.channelManager.provider,
            command: ctx.runnerFactory.command,
            args: JSON.stringify(ctx.runnerFactory.args),
            cwd: process.cwd(),
            mode: 'interactive',
            role: 'chat',
            parentId: forkedFromSession,
            createdAt: new Date().toISOString(),
          })
          .catch((err) => console.error('Failed to persist forked session:', err));
      }
      ctx.io?.emit('session:created', { channelId: newSessionId });
      callback({
        success: true,
        channelId: newSessionId,
        parentSessionId: forkedFromSession,
        events,
      });
    } catch (err) {
      callback({
        success: false,
        error: errMsg(err, 'Failed to fork session'),
      });
    }
  });

  socket.on('session:teleport', async (payload, callback) => {
    try {
      const parsed = sessionTeleportSchema.parse(payload);

      const events = await ctx.getSessionHistory(parsed.remoteSessionId);

      let branchCheckoutFailed = false;
      if (parsed.branch) {
        const branch = parsed.branch;
        const strategies = [
          () => execGit(['checkout', branch]),
          async () => {
            await execGit(['fetch', 'origin']);
            await execGit(['checkout', branch]);
          },
          () => execGit(['checkout', '--track', `origin/${branch}`]),
        ];
        branchCheckoutFailed = true;
        for (const strategy of strategies) {
          try {
            await strategy();
            branchCheckoutFailed = false;
            break;
          } catch {
            /* try next */
          }
        }
      }

      const hooks = ctx.buildChannelHooks(parsed.newSessionId);
      await ctx.channelManager.create(parsed.newSessionId, {
        hooks,
        launchOptions: { resumeSessionId: parsed.remoteSessionId },
        onBeforeSpawn: (ch) => ctx.addSocketToChannel(ch, socket),
      });

      ctx.io?.emit('session:created', { channelId: parsed.newSessionId });
      callback({
        success: true,
        channelId: parsed.newSessionId,
        events,
        ...(branchCheckoutFailed && { branchCheckoutFailed: true, branch: parsed.branch }),
      });
    } catch (err) {
      callback({
        success: false,
        error: errMsg(err, 'Failed to teleport session'),
      });
    }
  });

  socket.on('session:delete', async (payload, callback) => {
    try {
      const { channelId } = sessionDeleteSchema.parse(payload);
      const success = await ctx.sessionStore.delete(channelId);
      if (!success) {
        callback({ success: false, error: 'Session not found' });
        return;
      }
      callback({ success: true });
    } catch (err) {
      callback({
        success: false,
        error: errMsg(err, 'Failed to delete session'),
      });
    }
  });

  socket.on('session:rename', async (payload, callback) => {
    try {
      const { channelId, title } = sessionRenameSchema.parse(payload);
      const success = await ctx.sessionStore.rename(channelId, title);
      if (!success) {
        callback({ success: false, error: 'Session not found' });
        return;
      }
      callback({ success: true });
    } catch (err) {
      callback({
        success: false,
        error: errMsg(err, 'Failed to rename session'),
      });
    }
  });

  socket.on('session:list', async (payload, callback) => {
    try {
      const parsed = sessionListSchema.parse(payload);
      const result = await ctx.sessionStore.list({
        limit: parsed.limit,
        offset: parsed.offset,
        cwd: parsed.cwd,
      });
      const previews = await Promise.all(
        result.sessions.map((s) => ctx.rawEventStore.getPreview(s.sessionId ?? s.id)),
      );
      const sessions = result.sessions.map((s, i) => {
        const ch = ctx.channelManager.get(s.id);
        return {
          ...s,
          isActive: !!(ch && !ch.exited),
          lastAssistantMessage: previews[i].lastAssistant,
          firstUserMessage: previews[i].firstUser,
        };
      });
      callback({ sessions, total: result.total });
    } catch {
      callback({ sessions: [], total: 0 });
    }
  });

  socket.on('session:list_remote', async (payload, callback) => {
    try {
      const parsed = sessionListRemoteSchema.parse(payload);
      const result = await ctx.sessionStore.list({
        limit: parsed.limit,
        offset: parsed.offset,
      });
      const remoteSessions = result.sessions.filter((s) => s.parentId);
      callback({ sessions: remoteSessions, total: remoteSessions.length });
    } catch {
      callback({ sessions: [], total: 0 });
    }
  });

  socket.on('session:get', async (payload, callback) => {
    try {
      const { channelId } = sessionGetSchema.parse(payload);
      const session = await ctx.sessionStore.getById(channelId);
      if (!session) {
        callback({ error: 'Session not found' });
        return;
      }
      const events = await ctx.getSessionHistory(channelId);
      const channel = ctx.channelManager.get(channelId);
      callback({ session, events, meta: channel?.metaCache ?? {} });
    } catch (err) {
      callback({ error: errMsg(err, 'Failed to get session') });
    }
  });

  socket.on('session:raw_events', async (payload, callback) => {
    try {
      const { channelId } = sessionGetSchema.parse(payload);
      const entries = await ctx.rawEventStore.getBySession(await ctx.resolveSessionId(channelId));
      const events = entries.map((e) => {
        try {
          return { direction: e.direction, seq: e.seq, ...JSON.parse(e.raw) };
        } catch {
          return { direction: e.direction, seq: e.seq, raw: e.raw };
        }
      });
      callback({ events });
    } catch (_err) {
      callback({ events: [] });
    }
  });

  socket.on('session:generate_title', async (payload, callback) => {
    try {
      const { channelId, description, persist } = chatGenerateSessionTitleSchema.parse(payload);
      const channel = ctx.channelManager.get(channelId);
      if (channel) {
        const result = await channel.sendControlRequest('generate_session_title', {
          description,
          persist,
        });
        callback?.({ success: true, result });
      }
    } catch (err) {
      callback?.({ success: false, error: String(err) });
    }
  });

  socket.on('session:update_state', (payload, callback) => {
    try {
      const { channelId, title, state } = sessionUpdateStateSchema.parse(payload);
      ctx.io?.emit('session:states', {
        sessions: [{ channelId, state: state ?? 'idle', ...(title ? { title } : {}) }],
      });
      callback({ success: true });
    } catch (err) {
      callback({
        success: false,
        error: errMsg(err, 'Failed to update session state'),
      });
    }
  });
}
