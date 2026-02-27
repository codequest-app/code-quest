import type { SessionRecord, SessionStore } from './session-store.ts';

export class CompositeSessionStore implements SessionStore {
  constructor(private stores: SessionStore[]) {
    if (stores.length === 0) {
      throw new Error('CompositeSessionStore requires at least one store');
    }
  }

  async persist(record: SessionRecord): Promise<void> {
    const results = await Promise.allSettled(this.stores.map((s) => s.persist(record)));
    const allFailed = results.every((r) => r.status === 'rejected');
    if (allFailed) {
      const reasons = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => r.reason);
      throw new AggregateError(reasons, 'All session stores failed to persist');
    }
  }
}
