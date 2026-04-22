import type { RawEvent } from '@code-quest/summoner';
import { v7 as uuidv7 } from 'uuid';
import { fanOutWrites } from './composite-fan-out.ts';
import type { RawEventStore, SessionPreview } from './raw-event-store.ts';

export class CompositeRawEventStore implements RawEventStore {
  constructor(private stores: RawEventStore[]) {
    if (stores.length === 0) {
      throw new Error('CompositeRawEventStore requires at least one store');
    }
  }

  async append(event: RawEvent, id?: string): Promise<string> {
    const rowId = id ?? uuidv7();
    await fanOutWrites(this.stores, 'raw event append', (s) => s.append(event, rowId));
    return rowId;
  }

  getBySession(sessionId: string): Promise<RawEvent[]> {
    return this.stores[0].getBySession(sessionId);
  }

  getPreview(sessionId: string): Promise<SessionPreview> {
    return this.stores[0].getPreview(sessionId);
  }

  async cloneEvents(fromSessionId: string, toSessionId: string): Promise<void> {
    // Generate ids once — all backing stores end up with the same PKs for
    // cloned rows, keeping downstream references (e.g. raw_deltas.parent_id)
    // valid regardless of which backend answers reads.
    const rows = await this.stores[0].getBySession(fromSessionId);
    if (rows.length === 0) return;
    const ids = rows.map(() => uuidv7());
    await fanOutWrites(this.stores, 'raw event clone', (s) =>
      s.cloneEvents(fromSessionId, toSessionId, ids),
    );
  }
}
