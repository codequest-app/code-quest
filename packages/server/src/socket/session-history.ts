import {
  type ClientMessage,
  contentBlockSchema,
  controlRequestEventSchema,
  EVENTS,
  isRecord,
  type ServerToClientEvents,
} from '@code-quest/shared';
import type { ProviderAdapter } from '@code-quest/summoner';
import { logger } from '../logger.ts';
import type { RawEventService } from '../services/raw-event-service.ts';
import type { SessionPreview } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import type { Channel } from './channel.ts';
import { typedJsonObjectSchema, userMessageInputSchema } from './schemas.ts';
import type { TypedSocket } from './types.ts';

/** History-relevant socket event names — excludes streaming, control, and transient types. */
const HISTORY_NAMES = new Set<string>([
  EVENTS.message.assistant,
  EVENTS.message.user,
  EVENTS.message.result,
  EVENTS.session.init,
]);

export class SessionHistory {
  constructor(
    private rawEventService: RawEventService,
    private sessionStore: SessionStore,
    private adapter: ProviderAdapter,
    private getChannel: (id: string) => Channel | undefined,
  ) {}

  async resolveSessionId(channelId: string): Promise<string> {
    const channel = this.getChannel(channelId);
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
    const respondedRequestIds = this.adapter.extractRespondedRequestIds(rawEvents);
    const messages = this.replayEvents(rawEvents);
    return { messages, respondedRequestIds };
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

  private replayEvents(rawEvents: Array<{ raw: string; direction: string }>): ClientMessage[] {
    // First pass: detect if stdout already echoes user messages
    const hasStdoutUserEcho = rawEvents.some((e) => {
      if (e.direction !== 'out') return false;
      try {
        const obj: unknown = JSON.parse(e.raw.trim());
        return isRecord(obj) && obj.type === 'user';
      } catch {
        return false;
      }
    });

    // Second pass: replay in original order
    const result: ClientMessage[] = [];
    for (const event of rawEvents) {
      const trimmed = event.raw.trim();
      if (!trimmed) continue;

      try {
        const raw: unknown = JSON.parse(trimmed);
        if (!isRecord(raw)) continue;

        if (event.direction === 'out') {
          this.replayStdoutEvent(raw, result);
        } else if (event.direction === 'in' && !hasStdoutUserEcho) {
          this.replayStdinEvent(raw, result);
        }
      } catch (err) {
        logger.debug(err, 'Skipping malformed raw event during replay');
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
      if (
        message.name === EVENTS.control.permission ||
        message.name === EVENTS.control.elicitation
      ) {
        const { requestId } = controlRequestEventSchema.parse(message.payload);
        pendingRequests.push({ requestId, message });
      } else if (message.name === EVENTS.control.cancel) {
        const { requestId } = controlRequestEventSchema.parse(message.payload);
        respondedRequestIds.add(requestId);
      }
    }

    for (const { requestId, message } of pendingRequests) {
      if (respondedRequestIds.has(requestId)) continue;

      const eventName = message.name as keyof ServerToClientEvents;
      (socket.emit as (event: string, ...args: unknown[]) => void)(eventName, {
        channelId,
        ...message.payload,
      });
    }
  }
}
