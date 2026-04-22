import { logger } from '../logger.ts';
import type { RawDeltaEntry, RawDeltaStore } from './raw-delta-store.ts';

export class CompositeRawDeltaStore implements RawDeltaStore {
  constructor(private stores: RawDeltaStore[]) {
    if (stores.length === 0) {
      throw new Error('CompositeRawDeltaStore requires at least one store');
    }
  }

  async append(event: RawDeltaEntry): Promise<void> {
    const results = await Promise.allSettled(this.stores.map((s) => s.append(event)));
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failures.length === 0) return;
    if (failures.length < results.length) {
      for (const f of failures) {
        logger.error({ err: f.reason }, 'Partial raw delta append failure');
      }
      return;
    }
    throw new AggregateError(
      failures.map((r) => r.reason),
      'All delta stores failed to append',
    );
  }

  async getBySession(sessionId: string): Promise<RawDeltaEntry[]> {
    return this.stores[0].getBySession(sessionId);
  }
}
