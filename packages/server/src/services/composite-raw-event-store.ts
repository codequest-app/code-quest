import type { RawEvent } from '@code-quest/summoner';
import { v7 as uuidv7 } from 'uuid';
import { logger } from '../logger.ts';
import type { RawEventStore, SessionPreview } from './raw-event-store.ts';

export class CompositeRawEventStore implements RawEventStore {
  constructor(private stores: RawEventStore[]) {
    if (stores.length === 0) {
      throw new Error('CompositeRawEventStore requires at least one store');
    }
  }

  async append(event: RawEvent, id?: string): Promise<string> {
    const rowId = id ?? uuidv7();
    await this.fanOut('append', (s) => s.append(event, rowId));
    return rowId;
  }

  async getBySession(sessionId: string): Promise<RawEvent[]> {
    return this.stores[0].getBySession(sessionId);
  }

  async getPreview(sessionId: string): Promise<SessionPreview> {
    return this.stores[0].getPreview(sessionId);
  }

  async cloneEvents(fromSessionId: string, toSessionId: string): Promise<void> {
    await this.fanOut('clone', (s) => s.cloneEvents(fromSessionId, toSessionId));
  }

  private async fanOut(label: string, op: (s: RawEventStore) => Promise<unknown>): Promise<void> {
    const results = await Promise.allSettled(this.stores.map(op));
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failures.length === 0) return;
    if (failures.length < results.length) {
      for (const f of failures) {
        logger.error({ err: f.reason }, `Partial raw event ${label} failure`);
      }
      return;
    }
    throw new AggregateError(
      failures.map((r) => r.reason),
      `All stores failed to ${label}`,
    );
  }
}
