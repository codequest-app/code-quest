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

  async getByChannelId(channelId: string): Promise<SessionRecord | null> {
    return this.stores[0].getByChannelId(channelId);
  }

  async upsert(record: SessionRecord): Promise<void> {
    const results = await Promise.allSettled(this.stores.map((s) => s.upsert(record)));
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failures.length > 0 && failures.length < results.length) {
      for (const f of failures) {
        logger.error({ err: f.reason }, 'Partial session upsert failure');
      }
    }
    if (failures.length === results.length) {
      throw new AggregateError(
        failures.map((r) => r.reason),
        'All session stores failed to upsert',
      );
    }
  }

  private async fanoutBool(
    label: string,
    op: (s: SessionStore) => Promise<boolean>,
  ): Promise<boolean> {
    const results = await Promise.allSettled(this.stores.map(op));
    for (const r of results) {
      if (r.status === 'rejected') {
        logger.error({ err: r.reason }, `Partial session ${label} failure`);
      }
    }
    return results.some((r) => r.status === 'fulfilled' && r.value);
  }

  async rename(id: string, title: string): Promise<boolean> {
    return this.fanoutBool('rename', (s) => s.rename(id, title));
  }

  async updateStatus(id: string, status: string): Promise<boolean> {
    return this.fanoutBool('updateStatus', (s) => s.updateStatus(id, status));
  }

  async delete(id: string): Promise<boolean> {
    return this.fanoutBool('delete', (s) => s.delete(id));
  }

  async renameByChannelId(channelId: string, title: string): Promise<boolean> {
    const r = await this.getByChannelId(channelId);
    return r ? this.rename(r.id, title) : false;
  }

  async updateStatusByChannelId(channelId: string, status: string): Promise<boolean> {
    const r = await this.getByChannelId(channelId);
    return r ? this.updateStatus(r.id, status) : false;
  }

  async deleteByChannelId(channelId: string): Promise<boolean> {
    const r = await this.getByChannelId(channelId);
    return r ? this.delete(r.id) : false;
  }
}
