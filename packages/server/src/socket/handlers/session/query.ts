import {
  sessionGetPayloadSchema,
  sessionListPayloadSchema,
  sessionListRemotePayloadSchema,
} from '@code-quest/shared';
import { z } from 'zod';
import { logger } from '../../../logger.ts';
import type { HandlerContext } from '../../../types.ts';
import type { Channel } from '../../channel.ts';
import type { SocketCallback, TypedSocket } from '../../types.ts';
import { errMsg } from '../../utils/helpers.ts';

export function create({
  channelManager,
  sessionStore,
  sessionHistory,
  emitter,
}: Pick<HandlerContext, 'channelManager' | 'sessionStore' | 'sessionHistory' | 'emitter'>): void {
  async function handleList(
    _ch: Channel | null,
    payload: unknown,
    _socket?: TypedSocket,
    callback?: SocketCallback,
  ): Promise<void> {
    try {
      const parsed = sessionListPayloadSchema.parse(payload);
      const result = await sessionStore.list({
        limit: parsed.limit,
        offset: parsed.offset,
        cwd: parsed.cwd,
        hasParentId: parsed.hasParentId,
      });
      const previews = await Promise.all(
        result.sessions.map((s) => sessionHistory.getPreview(s.id)),
      );
      const sessions = result.sessions.map((s, i) => {
        const ch = channelManager.get(s.channelId);
        return {
          ...s,
          isActive: !!(ch && !ch.exited),
          lastAssistantMessage: previews[i].lastAssistant,
          firstUserMessage: previews[i].firstUser,
        };
      });
      callback?.({ sessions, total: result.total });
    } catch (err) {
      logger.debug(err, 'Failed to list sessions');
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
      const parsed = sessionListRemotePayloadSchema.parse(payload);
      const result = await sessionStore.list({
        limit: parsed.limit,
        offset: parsed.offset,
        hasParentId: true,
      });
      callback?.({ sessions: result.sessions, total: result.total });
    } catch (err) {
      logger.debug(err, 'Failed to list remote sessions');
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
      const { channelId } = sessionGetPayloadSchema.parse(payload);
      const session = await sessionStore.getByChannelId(channelId);
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
      const { channelId } = sessionGetPayloadSchema.parse(payload);
      const entries = await sessionHistory.getRawEntries(channelId);
      const rawJsonSchema = z.record(z.string(), z.unknown());
      const events = entries.map((e) => {
        try {
          const parsed = rawJsonSchema.safeParse(JSON.parse(e.raw));
          if (parsed.success) {
            return { direction: e.direction, seq: e.seq, ...parsed.data };
          }
          return { direction: e.direction, seq: e.seq, raw: e.raw };
        } catch (err) {
          logger.debug(err, 'Failed to parse raw event JSON');
          return { direction: e.direction, seq: e.seq, raw: e.raw };
        }
      });
      callback?.({ events });
    } catch (err) {
      logger.debug(err, 'Failed to get raw events');
      callback?.({ events: [] });
    }
  }

  emitter.on('session:list', handleList);
  emitter.on('session:list_remote', handleListRemote);
  emitter.on('session:get', handleGet);
  emitter.on('session:raw_events', handleRawEvents);
}
