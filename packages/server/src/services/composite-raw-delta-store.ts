import { fanOutWrites } from './composite-fan-out.ts';
import type { RawDeltaEntry, RawDeltaStore } from './raw-delta-store.ts';

export class CompositeRawDeltaStore implements RawDeltaStore {
  private readonly primary: RawDeltaStore;
  private stores: RawDeltaStore[];
  constructor(stores: RawDeltaStore[]) {
    if (stores.length === 0) {
      throw new Error('CompositeRawDeltaStore requires at least one store');
    }
    this.stores = stores;
    this.primary = stores[0] as RawDeltaStore;
  }

  async append(event: RawDeltaEntry): Promise<void> {
    await fanOutWrites(this.stores, 'raw delta append', (s) => s.append(event));
  }

  getBySession(sessionId: string): Promise<RawDeltaEntry[]> {
    return this.primary.getBySession(sessionId);
  }
}
