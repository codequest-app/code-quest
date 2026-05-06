import type { RawEvent } from '@code-quest/summoner';
import { v7 as uuidv7 } from 'uuid';
import { fanOutWrites } from './composite-fan-out.ts';
import type { RawEventStore, SessionPreview } from './raw-event-store.ts';

export class CompositeRawEventStore implements RawEventStore {
  private readonly primary: RawEventStore;
  private stores: RawEventStore[];
  constructor(stores: RawEventStore[]) {
    if (stores.length === 0) {
      throw new Error('CompositeRawEventStore requires at least one store');
    }
    this.stores = stores;
    // Safe: constructor throws if stores is empty (checked above).
    this.primary = stores[0] as RawEventStore;
  }

  async append(event: RawEvent, id?: string): Promise<string> {
    const rowId = id ?? uuidv7();
    await fanOutWrites(this.stores, 'raw event append', (s) => s.append(event, rowId));
    return rowId;
  }

  getBySession(sessionId: string): Promise<RawEvent[]> {
    return this.primary.getBySession(sessionId);
  }

  getPreview(sessionId: string): Promise<SessionPreview> {
    return this.primary.getPreview(sessionId);
  }

  hasUserEcho(sessionId: string): Promise<boolean> {
    return this.primary.hasUserEcho(sessionId);
  }

  streamBySession(sessionId: string, batchSize: number): AsyncGenerator<RawEvent[]> {
    return this.primary.streamBySession(sessionId, batchSize);
  }

  async cloneEvents(fromSessionId: string, toSessionId: string): Promise<void> {
    // Generate ids once — all backing stores end up with the same PKs for
    // cloned rows, keeping downstream references (e.g. raw_deltas.parent_id)
    // valid regardless of which backend answers reads.
    const rows = await this.primary.getBySession(fromSessionId);
    if (rows.length === 0) return;
    const ids = rows.map(() => uuidv7());
    await fanOutWrites(this.stores, 'raw event clone', (s) =>
      s.cloneEvents(fromSessionId, toSessionId, ids),
    );
  }
}
