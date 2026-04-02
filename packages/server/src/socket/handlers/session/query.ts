import { sessionGetSchema, sessionListRemoteSchema, sessionListSchema } from '@code-quest/shared';
import type { SessionStore } from '../../../services/session-store.ts';
import type { Channel } from '../../channel.ts';
import type { ChannelEmitter } from '../../channel-emitter.ts';
import type { ChannelManager } from '../../channel-manager.ts';
import type { SessionHistory } from '../../session-history.ts';
import type { SocketCallback, TypedSocket } from '../../types.ts';
import { errMsg } from '../../utils/helpers.ts';

export function create(
  channelManager: ChannelManager,
  sessionStore: SessionStore,
  sessionHistory: SessionHistory,
  emitter: ChannelEmitter,
): void {
  async function handleList(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
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
      callback?.({ sessions, total: result.total });
    } catch {
      callback?.({ sessions: [], total: 0 });
    }
  }

  async function handleListRemote(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const parsed = sessionListRemoteSchema.parse(payload);
      const result = await sessionStore.list({
        limit: parsed.limit,
        offset: parsed.offset,
        hasParentId: true,
      });
      callback?.({ sessions: result.sessions, total: result.total });
    } catch {
      callback?.({ sessions: [], total: 0 });
    }
  }

  async function handleGet(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const { channelId } = sessionGetSchema.parse(payload);
      const session = await sessionStore.getById(channelId);
      if (!session) {
        callback?.({ error: 'Session not found' });
        return;
      }
      const events = await sessionHistory.getSessionHistory(channelId);
      const channel = channelManager.get(channelId);
      callback?.({ session, events, meta: channel?.metaCache ?? {} });
    } catch (err) {
      callback?.({ error: errMsg(err, 'Failed to get session') });
    }
  }

  async function handleRawEvents(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
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
      callback?.({ events });
    } catch {
      callback?.({ events: [] });
    }
  }

  emitter.on('session:list', handleList);
  emitter.on('session:list_remote', handleListRemote);
  emitter.on('session:get', handleGet);
  emitter.on('session:raw_events', handleRawEvents);
}
