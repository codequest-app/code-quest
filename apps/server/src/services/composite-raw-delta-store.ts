import { CompositeStore } from './composite-store.ts';
import type { RawDeltaEntry, RawDeltaStore } from './raw-delta-store.ts';

export class CompositeRawDeltaStore extends CompositeStore<RawDeltaStore> implements RawDeltaStore {
  async append(event: RawDeltaEntry): Promise<void> {
    await this.fanOut('raw delta append', (s) => s.append(event));
  }

  getBySession(sessionId: string): Promise<RawDeltaEntry[]> {
    return this.primary.getBySession(sessionId);
  }

  async deleteBySession(sessionId: string): Promise<void> {
    await this.fanOut('raw delta delete', (s) => s.deleteBySession(sessionId));
  }
}
