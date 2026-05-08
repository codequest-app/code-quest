import { CompositeStore } from './composite-store.ts';
import type { SessionRecord, SessionStore } from './session-store.ts';

const anyTrue = (results: boolean[]) => results.some(Boolean);

export class CompositeSessionStore extends CompositeStore<SessionStore> implements SessionStore {
  async list(opts?: {
    limit?: number;
    offset?: number;
    cwd?: string;
    hasParentId?: boolean;
    excludeSessionIds?: string[];
  }): Promise<{ sessions: SessionRecord[]; total: number }> {
    return this.primary.list(opts);
  }

  async getById(id: string): Promise<SessionRecord | null> {
    return this.primary.getById(id);
  }

  async getByChannelId(channelId: string): Promise<SessionRecord | null> {
    return this.primary.getByChannelId(channelId);
  }

  async upsert(record: SessionRecord): Promise<void> {
    await this.fanOut('session upsert', (s) => s.upsert(record));
  }

  async rename(id: string, title: string): Promise<boolean> {
    return this.fanOutCollect('session rename', (s) => s.rename(id, title), anyTrue);
  }

  async updateStatus(id: string, status: string): Promise<boolean> {
    return this.fanOutCollect('session updateStatus', (s) => s.updateStatus(id, status), anyTrue);
  }

  async delete(id: string): Promise<boolean> {
    return this.fanOutCollect('session delete', (s) => s.delete(id), anyTrue);
  }

  async renameByChannelId(channelId: string, title: string): Promise<boolean> {
    return this.byChannelId(channelId, (id) => this.rename(id, title));
  }

  async updateStatusByChannelId(channelId: string, status: string): Promise<boolean> {
    return this.byChannelId(channelId, (id) => this.updateStatus(id, status));
  }

  async deleteByChannelId(channelId: string): Promise<boolean> {
    return this.byChannelId(channelId, (id) => this.delete(id));
  }

  private async byChannelId(
    channelId: string,
    op: (id: string) => Promise<boolean>,
  ): Promise<boolean> {
    const record = await this.getByChannelId(channelId);
    return record ? op(record.id) : false;
  }
}
