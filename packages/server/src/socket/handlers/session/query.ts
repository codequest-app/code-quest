import { sessionGetSchema, sessionListRemoteSchema, sessionListSchema } from '@code-quest/shared';
import type { SessionStore } from '../../../services/session-store.ts';
import type { ChannelManager } from '../../channel-manager.ts';
import type { SessionHistory } from '../../session-history.ts';
import type { SocketCallback, SocketHandler, TypedSocket } from '../../types.ts';
import { errMsg } from '../../utils/helpers.ts';

export function create(
  channelManager: ChannelManager,
  sessionStore: SessionStore,
  sessionHistory: SessionHistory,
): SocketHandler {
  async function handleList(payload: unknown, callback: SocketCallback): Promise<void> {
    try {
      const parsed = sessionListSchema.parse(payload);
      const result = await sessionStore.list({
        limit: parsed.limit,
        offset: parsed.offset,
        cwd: parsed.cwd,
        hasParentId: parsed.hasParentId,
      });
      const previews = await Promise.all(
        result.sessions.map((s) => sessionHistory.getPreview(s.sessionId ?? s.id)),
      );
      const sessions = result.sessions.map((s, i) => {
        const ch = channelManager.get(s.id);
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

  async function handleListRemote(payload: unknown, callback: SocketCallback): Promise<void> {
    try {
      const parsed = sessionListRemoteSchema.parse(payload);
      const result = await sessionStore.list({
        limit: parsed.limit,
        offset: parsed.offset,
        hasParentId: true,
      });
      callback({ sessions: result.sessions, total: result.total });
    } catch {
      callback({ sessions: [], total: 0 });
    }
  }

  async function handleGet(payload: unknown, callback: SocketCallback): Promise<void> {
    try {
      const { channelId } = sessionGetSchema.parse(payload);
      const session = await sessionStore.getById(channelId);
      if (!session) {
        callback({ error: 'Session not found' });
        return;
      }
      const events = await sessionHistory.getSessionHistory(channelId);
      const channel = channelManager.get(channelId);
      callback({ session, events, meta: channel?.metaCache ?? {} });
    } catch (err) {
      callback({ error: errMsg(err, 'Failed to get session') });
    }
  }

  async function handleRawEvents(payload: unknown, callback: SocketCallback): Promise<void> {
    try {
      const { channelId } = sessionGetSchema.parse(payload);
      const entries = await sessionHistory.getRawEntries(channelId);
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

  return {
    register(socket: TypedSocket) {
      socket.on('session:list', handleList);
      socket.on('session:list_remote', handleListRemote);
      socket.on('session:get', handleGet);
      socket.on('session:raw_events', handleRawEvents);
    },
  };
}
