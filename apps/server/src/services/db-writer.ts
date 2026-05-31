import type { SessionData, SessionSink } from '@code-quest/jsonl-codec';
import type { RawEventService } from './raw-event-service.ts';
import type { SessionStore } from './session-store.ts';

export class DbWriter implements SessionSink {
  private readonly rawEventService: RawEventService;
  private readonly sessionStore: SessionStore;

  constructor(rawEventService: RawEventService, sessionStore: SessionStore) {
    this.rawEventService = rawEventService;
    this.sessionStore = sessionStore;
  }

  async write(sessionId: string, data: SessionData): Promise<void> {
    const existing = await this.rawEventService.getBySession(sessionId);
    if (existing.length > 0) return;

    await this.sessionStore.upsert(data.record);
    for (const event of data.events) {
      await this.rawEventService.appendEvent(event);
    }
  }
}
