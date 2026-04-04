import type { ClientMessage, ServerToClientEvents } from '@code-quest/shared';
import type { ProviderAdapter } from '@code-quest/summoner';
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

  private replayEntries(rawEntries: Array<{ raw: string; direction: string }>): ClientMessage[] {
    const result: ClientMessage[] = [];

    // Check if stdout contains any user message echoes
    const hasStdoutUserEcho = rawEntries.some((e) => {
      if (e.direction !== 'out') return false;
      try {
        const obj = JSON.parse(e.raw.trim());
        return obj?.type === 'user';
      } catch {
        return false;
      }
    });

    for (const entry of rawEntries) {
      const trimmed = entry.raw.trim();
      if (!trimmed) continue;

      try {
        const raw = JSON.parse(trimmed);
        if (typeof raw !== 'object' || raw === null) continue;

        if (entry.direction === 'out') {
          const parsed = typedJsonObjectSchema.safeParse(raw);
          if (parsed.success) {
            const converted = this.adapter.transform(parsed.data).messages;
            result.push(...converted);
          }
        } else if (entry.direction === 'in') {
          // Skip stdin user messages when stdout already echoes them (avoids duplicates)
          if (hasStdoutUserEcho) continue;
          const parsed = userMessageInputSchema.safeParse(raw);
          if (parsed.success) {
            result.push({
              name: 'message:user',
              payload: { content: parsed.data.message.content },
            });
          }
        }
      } catch {
        // skip malformed raw entries (invalid JSON or unexpected shape)
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
