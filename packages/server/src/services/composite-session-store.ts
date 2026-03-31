import type { SessionRecord, SessionStore } from './session-store.ts';

export class CompositeSessionStore implements SessionStore {
  constructor(private stores: SessionStore[]) {
    if (stores.length === 0) {
      throw new Error('CompositeSessionStore requires at least one store');
    }
  }

  async list(opts?: {
    limit?: number;
    offset?: number;
    cwd?: string;
    hasParentId?: boolean;
  }): Promise<{ sessions: SessionRecord[]; total: number }> {
    return this.stores[0].list(opts);
  }

  async getById(id: string): Promise<SessionRecord | null> {
    return this.stores[0].getById(id);
  }

  async persist(record: SessionRecord): Promise<void> {
    const results = await Promise.allSettled(this.stores.map((s) => s.persist(record)));
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failures.length > 0 && failures.length < results.length) {
      for (const f of failures) {
        console.warn('Partial session persist failure:', f.reason);
      }
    }
    if (failures.length === results.length) {
      throw new AggregateError(
        failures.map((r) => r.reason),
        'All session stores failed to persist',
      );
    }
  }

  async rename(id: string, title: string): Promise<boolean> {
    return this.stores[0].rename(id, title);
  }

  async updateStatus(id: string, status: string): Promise<boolean> {
    return this.stores[0].updateStatus(id, status);
  }

  async delete(id: string): Promise<boolean> {
    const results = await Promise.allSettled(this.stores.map((s) => s.delete(id)));
    return results.some((r) => r.status === 'fulfilled' && r.value);
  }
}
