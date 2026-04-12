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

  async getById(channelId: string): Promise<SessionRecord | null> {
    return this.stores[0].getById(channelId);
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

  async rename(channelId: string, title: string): Promise<boolean> {
    const results = await Promise.allSettled(this.stores.map((s) => s.rename(channelId, title)));
    for (const r of results) {
      if (r.status === 'rejected') {
        logger.error({ err: r.reason }, 'Partial session rename failure');
      }
    }
    return results.some((r) => r.status === 'fulfilled' && r.value);
  }

  async updateStatus(channelId: string, status: string): Promise<boolean> {
    const results = await Promise.allSettled(
      this.stores.map((s) => s.updateStatus(channelId, status)),
    );
    for (const r of results) {
      if (r.status === 'rejected') {
        logger.error({ err: r.reason }, 'Partial session updateStatus failure');
      }
    }
    return results.some((r) => r.status === 'fulfilled' && r.value);
  }

  async delete(channelId: string): Promise<boolean> {
    const results = await Promise.allSettled(this.stores.map((s) => s.delete(channelId)));
    for (const r of results) {
      if (r.status === 'rejected') {
        logger.error({ err: r.reason }, 'Partial session delete failure');
      }
    }
    return results.some((r) => r.status === 'fulfilled' && r.value);
  }
}
