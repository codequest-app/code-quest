import type { ClientMessage, ServerToClientEvents } from '@code-quest/shared';
import type { ProviderAdapter } from '@code-quest/summoner';
import { logger } from '../logger.ts';
import type { RawEventStore, SessionPreview } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import type { Channel } from './channel.ts';
import {
  controlRequestEventSchema,
  typedJsonObjectSchema,
  userMessageInputSchema,
} from './schemas.ts';
import type { TypedSocket } from './types.ts';

/** History-relevant socket event names — excludes streaming, control, and transient types. */
const HISTORY_NAMES = new Set([
  'message:assistant',
  'message:user',
  'message:result',
  'session:init',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export class SessionHistory {
  constructor(
    private rawEventStore: RawEventStore,
    private sessionStore: SessionStore,
    private adapter: ProviderAdapter,
    private getChannel: (id: string) => Channel | undefined,
  ) {}

  async resolveSessionId(channelId: string): Promise<string> {
    const channel = this.getChannel(channelId);
    if (channel?.sessionId) return channel.sessionId;
    const record = await this.sessionStore.getById(channelId);
    return record?.sessionId ?? channelId;
  }

  async getSessionHistory(channelId: string): Promise<ClientMessage[]> {
    const sessionId = await this.resolveSessionId(channelId);
    const all = await this.replaySession(sessionId);
    return all.filter((e) => HISTORY_NAMES.has(e.name));
  }

  async getPreview(sessionId: string): Promise<SessionPreview> {
    return this.rawEventStore.getPreview(sessionId);
  }

  async getRawEntries(
    channelId: string,
  ): Promise<Array<{ direction: string; seq: number; raw: string }>> {
    const sessionId = await this.resolveSessionId(channelId);
    return this.rawEventStore.getBySession(sessionId);
  }

  async getPendingReplayMessages(sessionId: string): Promise<{
    messages: ClientMessage[];
    respondedRequestIds: Set<string>;
  }> {
    const rawEntries = await this.rawEventStore.getBySession(sessionId);
    const respondedRequestIds = this.adapter.extractRespondedRequestIds(rawEntries);
    const messages = this.replayEntries(rawEntries);
    return { messages, respondedRequestIds };
  }

  private async replaySession(sessionId: string): Promise<ClientMessage[]> {
    const rawEntries = await this.rawEventStore.getBySession(sessionId);
    return this.replayEntries(rawEntries);
  }

  private replayStdoutEntry(raw: Record<string, unknown>, result: ClientMessage[]): void {
    const parsed = typedJsonObjectSchema.safeParse(raw);
    if (parsed.success) {
      const converted = this.adapter.transform(parsed.data).messages;
      result.push(...converted);
    }
  }

  private replayStdinEntry(raw: Record<string, unknown>, result: ClientMessage[]): void {
    const parsed = userMessageInputSchema.safeParse(raw);
    if (parsed.success) {
      result.push({
        name: 'message:user',
        payload: { content: parsed.data.message.content },
      });
    }
  }

  private replayEntries(rawEntries: Array<{ raw: string; direction: string }>): ClientMessage[] {
    const result: ClientMessage[] = [];
    const stdinEntries: Array<Record<string, unknown>> = [];
    let hasStdoutUserEcho = false;

    for (const entry of rawEntries) {
      const trimmed = entry.raw.trim();
      if (!trimmed) continue;

      try {
        const raw: unknown = JSON.parse(trimmed);
        if (!isRecord(raw)) continue;

        if (entry.direction === 'out') {
          if (raw.type === 'user') hasStdoutUserEcho = true;
          this.replayStdoutEntry(raw, result);
        } else if (entry.direction === 'in') {
          stdinEntries.push(raw);
        }
      } catch (err) {
        logger.debug(err, 'Skipping malformed raw entry during replay');
      }
    }

    if (!hasStdoutUserEcho) {
      for (const raw of stdinEntries) {
        this.replayStdinEntry(raw, result);
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
      if (message.name === 'control:permission' || message.name === 'control:elicitation') {
        const { requestId } = controlRequestEventSchema.parse(message.payload);
        pendingRequests.push({ requestId, message });
      } else if (message.name === 'control:cancel') {
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
