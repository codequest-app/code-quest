import { fanOutWrites } from './composite-fan-out.ts';
import type { RawDeltaEntry, RawDeltaStore } from './raw-delta-store.ts';

export class CompositeRawDeltaStore implements RawDeltaStore {
  constructor(private stores: RawDeltaStore[]) {
    if (stores.length === 0) {
      throw new Error('CompositeRawDeltaStore requires at least one store');
    }
  }

  async append(event: RawDeltaEntry): Promise<void> {
    await fanOutWrites(this.stores, 'raw delta append', (s) => s.append(event));
  }

  getBySession(sessionId: string): Promise<RawDeltaEntry[]> {
    return this.stores[0].getBySession(sessionId);
  }
}
