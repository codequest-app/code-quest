import { CompositeSessionStore } from '../services/composite-session-store.ts';
import type { SessionRecord, SessionStore } from '../services/session-store.ts';

function makeRecord(id: string, overrides?: Partial<SessionRecord>): SessionRecord {
  return {
    id,
    channelId: id,
    provider: 'claude',
    command: 'claude',
    args: '[]',
    mode: 'print',
    role: 'chat',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

class FakeStore implements SessionStore {
  rows = new Map<string, SessionRecord>();
  failures = new Set<string>();

  async upsert(r: SessionRecord) {
    if (this.failures.has('upsert')) throw new Error('upsert failed');
    this.rows.set(r.id, r);
  }
  async list() {
    return { sessions: [...this.rows.values()], total: this.rows.size };
  }
  async getById(id: string) {
    return this.rows.get(id) ?? null;
  }
  async getByChannelId(channelId: string) {
    for (const r of this.rows.values()) if (r.channelId === channelId) return r;
    return null;
  }
  async rename(id: string, title: string) {
    if (this.failures.has('rename')) throw new Error('rename failed');
    const r = this.rows.get(id);
    if (!r) return false;
    this.rows.set(id, { ...r, title });
    return true;
  }
  async updateStatus(id: string, status: string) {
    if (this.failures.has('updateStatus')) throw new Error('updateStatus failed');
    const r = this.rows.get(id);
    if (!r) return false;
    this.rows.set(id, { ...r, status });
    return true;
  }
  async delete(id: string) {
    if (this.failures.has('delete')) throw new Error('delete failed');
    return this.rows.delete(id);
  }
  async renameByChannelId(channelId: string, title: string) {
    const r = await this.getByChannelId(channelId);
    return r ? this.rename(r.id, title) : false;
  }
  async updateStatusByChannelId(channelId: string, status: string) {
    const r = await this.getByChannelId(channelId);
    return r ? this.updateStatus(r.id, status) : false;
  }
  async deleteByChannelId(channelId: string) {
    const r = await this.getByChannelId(channelId);
    return r ? this.delete(r.id) : false;
  }
}

describe('CompositeSessionStore', () => {
  let a: FakeStore;
  let b: FakeStore;
  let composite: CompositeSessionStore;

  beforeEach(() => {
    a = new FakeStore();
    b = new FakeStore();
    composite = new CompositeSessionStore([a, b]);
  });

  describe('upsert', () => {
    it('writes to all stores on success', async () => {
      await composite.upsert(makeRecord('s1'));
      expect(a.rows.has('s1')).toBe(true);
      expect(b.rows.has('s1')).toBe(true);
    });

    it('tolerates partial failure (logs, does not throw)', async () => {
      b.failures.add('upsert');
      await composite.upsert(makeRecord('s1'));
      expect(a.rows.has('s1')).toBe(true);
    });

    it('throws AggregateError when all stores fail', async () => {
      a.failures.add('upsert');
      b.failures.add('upsert');
      await expect(composite.upsert(makeRecord('s1'))).rejects.toThrow(AggregateError);
    });
  });

  describe('rename / updateStatus / delete', () => {
    beforeEach(async () => {
      await composite.upsert(makeRecord('s1', { channelId: 'ch-A' }));
    });

    it('rename returns true when any store updates', async () => {
      expect(await composite.rename('s1', 'New')).toBe(true);
      expect(a.rows.get('s1')!.title).toBe('New');
      expect(b.rows.get('s1')!.title).toBe('New');
    });

    it('rename returns false when no store has the id', async () => {
      expect(await composite.rename('missing', 'x')).toBe(false);
    });

    it('updateStatus returns true when any store updates', async () => {
      expect(await composite.updateStatus('s1', 'dead')).toBe(true);
      expect(a.rows.get('s1')!.status).toBe('dead');
    });

    it('delete returns true when any store deletes', async () => {
      expect(await composite.delete('s1')).toBe(true);
      expect(a.rows.has('s1')).toBe(false);
      expect(b.rows.has('s1')).toBe(false);
    });

    it('partial failure still returns true if another store succeeded', async () => {
      b.failures.add('rename');
      expect(await composite.rename('s1', 'New')).toBe(true);
      expect(a.rows.get('s1')!.title).toBe('New');
    });
  });

  describe('ByChannelId helpers', () => {
    beforeEach(async () => {
      await composite.upsert(makeRecord('s1', { channelId: 'ch-A' }));
    });

    it('renameByChannelId updates via channelId lookup', async () => {
      expect(await composite.renameByChannelId('ch-A', 'New')).toBe(true);
      expect(a.rows.get('s1')!.title).toBe('New');
      expect(b.rows.get('s1')!.title).toBe('New');
    });

    it('renameByChannelId returns false when channelId not found', async () => {
      expect(await composite.renameByChannelId('ch-missing', 'x')).toBe(false);
    });

    it('updateStatusByChannelId updates via channelId lookup', async () => {
      expect(await composite.updateStatusByChannelId('ch-A', 'dead')).toBe(true);
      expect(a.rows.get('s1')!.status).toBe('dead');
    });

    it('deleteByChannelId removes via channelId lookup', async () => {
      expect(await composite.deleteByChannelId('ch-A')).toBe(true);
      expect(a.rows.has('s1')).toBe(false);
    });
  });
});
