import { logger } from '../logger.ts';
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
        logger.error({ err: f.reason }, 'Partial session persist failure');
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
    const results = await Promise.allSettled(this.stores.map((s) => s.rename(id, title)));
    for (const r of results) {
      if (r.status === 'rejected') {
        logger.error({ err: r.reason }, 'Partial session rename failure');
      }
    }
    return results.some((r) => r.status === 'fulfilled' && r.value);
  }

  async updateStatus(id: string, status: string): Promise<boolean> {
    const results = await Promise.allSettled(this.stores.map((s) => s.updateStatus(id, status)));
    for (const r of results) {
      if (r.status === 'rejected') {
        logger.error({ err: r.reason }, 'Partial session updateStatus failure');
      }
    }
    return results.some((r) => r.status === 'fulfilled' && r.value);
  }

  async delete(id: string): Promise<boolean> {
    const results = await Promise.allSettled(this.stores.map((s) => s.delete(id)));
    for (const r of results) {
      if (r.status === 'rejected') {
        logger.error({ err: r.reason }, 'Partial session delete failure');
      }
    }
    return results.some((r) => r.status === 'fulfilled' && r.value);
  }
}
