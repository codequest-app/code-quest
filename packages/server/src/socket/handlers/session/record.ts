import {
  sessionDeleteSchema,
  sessionGetSchema,
  sessionListRemoteSchema,
  sessionListSchema,
  sessionRenameSchema,
} from '@code-quest/shared';
import type { HandlerContext } from '../../context.ts';
import type { TypedSocket } from '../../types.ts';
import { errMsg } from '../../types.ts';

export function registerRecord(socket: TypedSocket, ctx: HandlerContext): void {
  socket.on('session:delete', async (payload, callback) => handleDelete(ctx, payload, callback));
  socket.on('session:rename', async (payload, callback) => handleRename(ctx, payload, callback));
  socket.on('session:list', async (payload, callback) => handleList(ctx, payload, callback));
  socket.on('session:list_remote', async (payload, callback) =>
    handleListRemote(ctx, payload, callback),
  );
  socket.on('session:get', async (payload, callback) => handleGet(ctx, payload, callback));
  socket.on('session:raw_events', async (payload, callback) =>
    handleRawEvents(ctx, payload, callback),
  );
}

async function handleDelete(
  ctx: HandlerContext,
  payload: unknown,
  callback: Function,
): Promise<void> {
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
}

async function handleRename(
  ctx: HandlerContext,
  payload: unknown,
  callback: Function,
): Promise<void> {
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
}

async function handleList(
  ctx: HandlerContext,
  payload: unknown,
  callback: Function,
): Promise<void> {
  try {
    const parsed = sessionListSchema.parse(payload);
    const result = await ctx.sessionStore.list({
      limit: parsed.limit,
      offset: parsed.offset,
      cwd: parsed.cwd,
      hasParentId: parsed.hasParentId,
    });
    const previews = await Promise.all(
      result.sessions.map((s) => ctx.sessionHistory.getPreview(s.sessionId ?? s.id)),
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
}

async function handleListRemote(
  ctx: HandlerContext,
  payload: unknown,
  callback: Function,
): Promise<void> {
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
}

async function handleGet(ctx: HandlerContext, payload: unknown, callback: Function): Promise<void> {
  try {
    const { channelId } = sessionGetSchema.parse(payload);
    const session = await ctx.sessionStore.getById(channelId);
    if (!session) {
      callback({ error: 'Session not found' });
      return;
    }
    const events = await ctx.sessionHistory.getSessionHistory(channelId);
    const channel = ctx.channelManager.get(channelId);
    callback({ session, events, meta: channel?.metaCache ?? {} });
  } catch (err) {
    callback({ error: errMsg(err, 'Failed to get session') });
  }
}

async function handleRawEvents(
  ctx: HandlerContext,
  payload: unknown,
  callback: Function,
): Promise<void> {
  try {
    const { channelId } = sessionGetSchema.parse(payload);
    const entries = await ctx.sessionHistory.getRawEntries(channelId);
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
}
