import type { RawEvent } from '@code-quest/summoner';
import type { RawDeltaEntry, RawDeltaStore } from './raw-delta-store.ts';
import type { RawEventStore, SessionPreview } from './raw-event-store.ts';

/**
 * Facade presenting a single public API over the split raw_events / raw_deltas
 * storage. Consumers treat this as "the event store"; the split is an
 * implementation detail they don't see.
 *
 * Write-side routing:
 *  - appendEvent  → raw_events (returns inserted id)
 *  - appendDelta  → raw_deltas (parent_id points at the user-stdin raw_events row)
 *
 * Read-side: `getBySession` returns the DB-level UNION ALL of both tables,
 * configured at the store layer. `cloneEvents` uses an events-only path
 * internally — forks carry conversation state, not token-stream debug data.
 */
export class RawEventService {
  private eventStore: RawEventStore;
  private deltaStore: RawDeltaStore;
  constructor(eventStore: RawEventStore, deltaStore: RawDeltaStore) {
    this.eventStore = eventStore;
    this.deltaStore = deltaStore;
  }

  appendEvent(event: RawEvent, id?: string): Promise<string> {
    return this.eventStore.append(event, id);
  }

  appendDelta(entry: RawDeltaEntry): Promise<void> {
    return this.deltaStore.append(entry);
  }

  getBySession(sessionId: string): Promise<RawEvent[]> {
    return this.eventStore.getBySession(sessionId);
  }

  getPreview(sessionId: string): Promise<SessionPreview> {
    return this.eventStore.getPreview(sessionId);
  }

  cloneEvents(fromSessionId: string, toSessionId: string): Promise<void> {
    return this.eventStore.cloneEvents(fromSessionId, toSessionId);
  }

  hasUserEcho(sessionId: string): Promise<boolean> {
    return this.eventStore.hasUserEcho(sessionId);
  }

  streamBySession(sessionId: string, batchSize: number): AsyncGenerator<RawEvent[]> {
    return this.eventStore.streamBySession(sessionId, batchSize);
  }

  async deleteBySession(sessionId: string): Promise<void> {
    await this.eventStore.deleteBySession(sessionId);
    await this.deltaStore.deleteBySession(sessionId);
  }
}
