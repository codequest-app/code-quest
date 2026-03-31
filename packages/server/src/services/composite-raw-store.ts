import type { RawEntry } from '@code-quest/summoner';
import { logger } from '../logger.ts';
import type { RawEventStore, SessionPreview } from './raw-event-store.ts';

export class CompositeRawStore implements RawEventStore {
  constructor(private stores: RawEventStore[]) {
    if (stores.length === 0) {
      throw new Error('CompositeRawStore requires at least one store');
    }
  }

  async append(entry: RawEntry): Promise<void> {
    const results = await Promise.allSettled(this.stores.map((s) => s.append(entry)));
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failures.length > 0 && failures.length < results.length) {
      for (const f of failures) {
        logger.error({ err: f.reason }, 'Partial raw event append failure');
      }
    }
    if (failures.length === results.length) {
      throw new AggregateError(
        failures.map((r) => r.reason),
        'All stores failed to append',
      );
    }
  }

  async getBySession(sessionId: string): Promise<RawEntry[]> {
    return this.stores[0].getBySession(sessionId);
  }

  async getPreview(sessionId: string): Promise<SessionPreview> {
    return this.stores[0].getPreview(sessionId);
  }
}
