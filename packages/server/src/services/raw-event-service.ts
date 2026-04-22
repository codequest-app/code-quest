import type { RawEvent } from '@code-quest/summoner';
import type { RawDeltaEntry, RawDeltaStore } from './raw-delta-store.ts';
import type { RawEventStore, SessionPreview } from './raw-event-store.ts';

export interface GetBySessionOptions {
  /** When true, UNION raw_events + raw_deltas and sort by seq. Default false. */
  includeDeltas?: boolean;
}

/**
 * Facade presenting a single public API over the split raw_events / raw_deltas
 * storage. Consumers treat this as "the event store"; the split is an
 * implementation detail they don't see.
 *
 * Write-side routing:
 *  - appendEvent  → raw_events (returns inserted id)
 *  - appendDelta  → raw_deltas (parent_id is the raw_events.id that kicked
 *                   off the turn; caller supplies it)
 *
 * Read-side default is events-only to preserve chat-replay semantics.
 * RawEventPanel opts into UNION via { includeDeltas: true }.
 */
export class RawEventService {
  constructor(
    private eventStore: RawEventStore,
    private deltaStore: RawDeltaStore,
  ) {}

  appendEvent(event: RawEvent, id?: string): Promise<string> {
    return this.eventStore.append(event, id);
  }

  appendDelta(entry: RawDeltaEntry): Promise<void> {
    return this.deltaStore.append(entry);
  }

  async getBySession(sessionId: string, opts?: GetBySessionOptions): Promise<RawEvent[]> {
    if (!opts?.includeDeltas) return this.eventStore.getBySession(sessionId);
    // Two independent queries — parallelize.
    const [events, deltas] = await Promise.all([
      this.eventStore.getBySession(sessionId),
      this.deltaStore.getBySession(sessionId),
    ]);
    // Deltas return as RawDeltaEntry (with parentId); the RawEvent surface
    // drops parentId via the projection below. UNION ORDER BY seq.
    const merged: RawEvent[] = [
      ...events,
      ...deltas.map((d) => ({
        sessionId: d.sessionId,
        direction: d.direction,
        raw: d.raw,
        seq: d.seq,
        timestamp: d.timestamp,
      })),
    ];
    merged.sort((a, b) => a.seq - b.seq);
    return merged;
  }

  getPreview(sessionId: string): Promise<SessionPreview> {
    return this.eventStore.getPreview(sessionId);
  }

  cloneEvents(fromSessionId: string, toSessionId: string): Promise<void> {
    return this.eventStore.cloneEvents(fromSessionId, toSessionId);
  }
}
