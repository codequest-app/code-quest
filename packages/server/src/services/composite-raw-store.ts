import type { RawEntry } from '@code-quest/summoner';
import type { RawEventStore } from './raw-event-store.ts';

export class CompositeRawStore implements RawEventStore {
  constructor(private stores: RawEventStore[]) {
    if (stores.length === 0) {
      throw new Error('CompositeRawStore requires at least one store');
    }
  }

  async append(entry: RawEntry): Promise<void> {
    const results = await Promise.allSettled(this.stores.map((s) => s.append(entry)));
    const allFailed = results.every((r) => r.status === 'rejected');
    if (allFailed) {
      const reasons = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => r.reason);
      throw new AggregateError(reasons, 'All stores failed to append');
    }
  }

  async getBySession(sessionId: string): Promise<RawEntry[]> {
    return this.stores[0].getBySession(sessionId);
  }
}
