import type { SocketCallback, TypedSocket } from '@code-quest/schemas';
import {
  ERROR_CODES,
  EVENTS,
  sessionGetPayloadSchema,
  sessionListPayloadSchema,
  sessionListRemotePayloadSchema,
} from '@code-quest/schemas';
import { errMsg } from '@code-quest/utils';
import { z } from 'zod';
import { logger } from '../../../logger.ts';
import type { HandlerContext } from '../../../types.ts';
import type { Channel } from '../../channel.ts';
import { err, ok } from '../../utils/rpc.ts';

const rawJsonSchema = z.record(z.string(), z.unknown());

function parseRawEventEntry(e: { direction: string; raw: string }): Record<string, unknown> {
  try {
    const parsed = rawJsonSchema.safeParse(JSON.parse(e.raw));
    if (parsed.success) {
      return { direction: e.direction, ...parsed.data };
    }
  } catch (err) {
    logger.debug({ err }, 'Failed to parse raw event JSON');
  }
  return { direction: e.direction, raw: e.raw };
}

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
      const rawAliveIds = channelManager.getAliveSessionIds();
      const aliveSessionIds = new Set(rawAliveIds);
      const excludeSessionIds = parsed.excludeLive ? rawAliveIds : undefined;
      const result = await sessionStore.list({
        limit: parsed.limit,
        offset: parsed.offset,
        cwd: parsed.cwd,
        hasParentId: parsed.hasParentId,
        excludeSessionIds,
      });
      const previews = await Promise.all(
        result.sessions.map((s) => sessionHistory.getPreview(s.id)),
      );
      const sessions = result.sessions.map((s, i) => {
        return {
          ...s,
          isActive: aliveSessionIds.has(s.id),
          lastAssistantMessage: previews[i]?.lastAssistant,
          firstUserMessage: previews[i]?.firstUser,
        };
      });
      callback?.(ok({ sessions, total: result.total }));
    } catch (e) {
      logger.debug({ err: e }, 'Failed to list sessions');
      callback?.(ok({ sessions: [], total: 0 }));
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
      callback?.(ok({ sessions: result.sessions, total: result.total }));
    } catch (e) {
      logger.debug({ err: e }, 'Failed to list remote sessions');
      callback?.(ok({ sessions: [], total: 0 }));
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
        callback?.(err('Session not found', ERROR_CODES.SESSION_NOT_FOUND));
        return;
      }
      const events = await sessionHistory.getSessionHistory(channelId);
      const channel = channelManager.get(channelId);
      callback?.(ok({ session, events, meta: channel?.metaCache ?? {} }));
    } catch (e) {
      callback?.(err(errMsg(e, 'Failed to get session')));
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
      const rawEvents = await sessionHistory.getRawEvents(channelId);
      const events = rawEvents.map(parseRawEventEntry);
      callback?.({ events });
    } catch (err) {
      logger.debug({ err }, 'Failed to get raw events');
      callback?.({ events: [] });
    }
  }

  emitter.on(EVENTS.session.list, handleList);
  emitter.on(EVENTS.session.list_remote, handleListRemote);
  emitter.on(EVENTS.session.get, handleGet);
  emitter.on(EVENTS.session.raw_events, handleRawEvents);
}
