import {
  type ClientMessage,
  contentBlockSchema,
  controlRequestEventSchema,
  EVENTS,
  isRecord,
} from '@code-quest/shared';
import type { ProviderAdapter, RawEvent } from '@code-quest/summoner';
import { logger } from '../logger.ts';
import type { RawEventService } from '../services/raw-event-service.ts';
import type { SessionPreview } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import type { Channel } from './channel.ts';
import { typedJsonObjectSchema, userMessageInputSchema } from './schemas.ts';
import type { TypedSocket } from './types.ts';

type RawEventDirection = RawEvent['direction'];

/** History-relevant socket event names — excludes streaming, control, and transient types. */
const HISTORY_NAMES = new Set<string>([
  EVENTS.message.assistant,
  EVENTS.message.user,
  EVENTS.message.result,
  EVENTS.session.init,
]);

/** Minimal surface SessionHistory needs from ChannelManager. */
export interface ChannelLookup {
  get(id: string): Channel | undefined;
}

function parseRawEvents(
  rawEvents: Array<{ raw: string; direction: RawEventDirection }>,
): Array<{ direction: RawEventDirection; obj: Record<string, unknown> }> {
  const parsed: Array<{ direction: RawEventDirection; obj: Record<string, unknown> }> = [];
  for (const event of rawEvents) {
    const trimmed = event.raw.trim();
    if (!trimmed) continue;
    try {
      const raw: unknown = JSON.parse(trimmed);
      if (!isRecord(raw)) continue;
      parsed.push({ direction: event.direction, obj: raw });
    } catch (err) {
      logger.debug(err, 'Skipping malformed raw event during replay');
    }
  }
  return parsed;
}

export class SessionHistory {
  constructor(
    private rawEventService: RawEventService,
    private sessionStore: SessionStore,
    private adapter: ProviderAdapter,
    private channels: ChannelLookup,
  ) {}

  async resolveSessionId(channelId: string): Promise<string> {
    const channel = this.channels.get(channelId);
    if (channel?.sessionId) return channel.sessionId;
    const record = await this.sessionStore.getByChannelId(channelId);
    return record?.id ?? channelId;
  }

  async getSessionHistory(channelId: string): Promise<ClientMessage[]> {
    const sessionId = await this.resolveSessionId(channelId);
    const all = await this.replaySession(sessionId);
    return all.filter((e) => HISTORY_NAMES.has(e.name));
  }

  async getPreview(sessionId: string): Promise<SessionPreview> {
    return this.rawEventService.getPreview(sessionId);
  }

  async getRawEvents(
    channelId: string,
  ): Promise<Array<{ direction: string; seq: number; raw: string }>> {
    const sessionId = await this.resolveSessionId(channelId);
    return this.rawEventService.getBySession(sessionId);
  }

  async getPendingReplayMessages(sessionId: string): Promise<{
    messages: ClientMessage[];
    respondedRequestIds: Set<string>;
  }> {
    const rawEvents = await this.rawEventService.getBySession(sessionId);
    const parsed = parseRawEvents(rawEvents);
    return {
      messages: this.replayParsed(parsed),
      respondedRequestIds: this.adapter.extractRespondedRequestIds(parsed),
    };
  }

  private async replaySession(sessionId: string): Promise<ClientMessage[]> {
    const rawEvents = await this.rawEventService.getBySession(sessionId);
    return this.replayEvents(rawEvents);
  }

  private replayStdoutEvent(raw: Record<string, unknown>, result: ClientMessage[]): void {
    const parsed = typedJsonObjectSchema.safeParse(raw);
    if (parsed.success) {
      const converted = this.adapter.transform(parsed.data).messages;
      result.push(...converted);
    }
  }

  private replayStdinEvent(raw: Record<string, unknown>, result: ClientMessage[]): void {
    const parsed = userMessageInputSchema.safeParse(raw);
    if (parsed.success) {
      const blocks = parsed.data.message.content.flatMap((b) => {
        const parsedBlock = contentBlockSchema.safeParse(b);
        return parsedBlock.success ? [parsedBlock.data] : [];
      });
      result.push({
        name: EVENTS.message.user,
        payload: { content: blocks },
      });
    }
  }

  private replayEvents(
    rawEvents: Array<{ raw: string; direction: RawEventDirection }>,
  ): ClientMessage[] {
    return this.replayParsed(parseRawEvents(rawEvents));
  }

  private replayParsed(
    parsed: Array<{ direction: RawEventDirection; obj: Record<string, unknown> }>,
  ): ClientMessage[] {
    const hasStdoutUserEcho = parsed.some((e) => e.direction === 'out' && e.obj.type === 'user');
    const result: ClientMessage[] = [];
    for (const event of parsed) {
      if (event.direction === 'out') {
        this.replayStdoutEvent(event.obj, result);
      } else if (event.direction === 'in' && !hasStdoutUserEcho) {
        this.replayStdinEvent(event.obj, result);
      }
    }
    return result;
  }

  async replayPendingControlRequests(
    socket: TypedSocket,
    channelId: string,
    sessionId: string,
  ): Promise<void> {
    const { messages, respondedRequestIds } = await this.getPendingReplayMessages(sessionId);

    const pendingRequests: Array<{ requestId: string; message: ClientMessage }> = [];

    for (const message of messages) {
      const isPending =
        message.name === EVENTS.control.permission || message.name === EVENTS.control.elicitation;
      const isCancel = message.name === EVENTS.control.cancel;
      if (!isPending && !isCancel) continue;

      const parsed = controlRequestEventSchema.safeParse(message.payload);
      if (!parsed.success) {
        logger.warn({ err: parsed.error, name: message.name }, 'Malformed control event in replay');
        continue;
      }
      if (isPending) pendingRequests.push({ requestId: parsed.data.requestId, message });
      else respondedRequestIds.add(parsed.data.requestId);
    }

    for (const { requestId, message } of pendingRequests) {
      if (respondedRequestIds.has(requestId)) continue;

      (socket.emit as (event: string, ...args: unknown[]) => void)(message.name, {
        channelId,
        ...message.payload,
      });
    }
  }
}
