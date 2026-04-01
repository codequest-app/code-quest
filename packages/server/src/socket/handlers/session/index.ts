import {
  chatGenerateSessionTitleSchema,
  sessionDeleteSchema,
  sessionGetSchema,
  sessionListRemoteSchema,
  sessionListSchema,
  sessionRenameSchema,
  sessionUpdateStateSchema,
} from '@code-quest/shared';
import type { HandlerContext } from '../../context.ts';
import type { TypedSocket } from '../../types.ts';
import { errMsg } from '../../types.ts';
import { register as registerForkHandlers } from './fork.ts';
import { register as registerLifecycleHandlers } from './lifecycle.ts';

export function register(socket: TypedSocket, ctx: HandlerContext): void {
  registerLifecycleHandlers(socket, ctx);
  registerForkHandlers(socket, ctx);

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
      callback({ success: false, error: errMsg(err, 'Failed to delete session') });
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
      callback({ success: false, error: errMsg(err, 'Failed to rename session') });
    }
  });

  socket.on('session:list', async (payload, callback) => {
    try {
      const parsed = sessionListSchema.parse(payload);
      const result = await ctx.sessionStore.list({
        limit: parsed.limit,
        offset: parsed.offset,
        cwd: parsed.cwd,
        hasParentId: parsed.hasParentId,
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
        hasParentId: true,
      });
      callback({ sessions: result.sessions, total: result.total });
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
    } catch {
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
      callback({ success: false, error: errMsg(err, 'Failed to update session state') });
    }
  });
}
