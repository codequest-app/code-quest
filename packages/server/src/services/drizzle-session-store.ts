import { and, type Column, count, desc, eq, isNotNull, ne, notInArray } from 'drizzle-orm';
import { z } from 'zod';
import type { DrizzleDb } from './drizzle-types.ts';
import { type SessionRecord, type SessionStore, sessionRecordSchema } from './session-store.ts';

interface SessionsTable {
  id: Column;
  channelId: Column;
  provider: Column;
  command: Column;
  args: Column;
  cwd: Column;
  projectRoot: Column;
  mode: Column;
  role: Column;
  parentId: Column;
  title: Column;
  status: Column;
  createdAt: Column;
}

export class DrizzleSessionStore implements SessionStore {
  private db: DrizzleDb;
  private sessions: SessionsTable;
  constructor(db: DrizzleDb, sessions: SessionsTable) {
    this.db = db;
    this.sessions = sessions;
  }

  // Read-then-write; not atomic. Safe because onSessionInit is the only caller
  // and each channel emits session:init once. Switch to onConflictDoUpdate if
  // concurrent upserts for the same sessionId become realistic.
  async upsert(record: SessionRecord): Promise<void> {
    const existing = await this.getById(record.id);
    if (existing) {
      await this.db
        .update(this.sessions)
        .set({
          channelId: record.channelId,
          status: 'active',
          ...(record.parentId ? { parentId: record.parentId } : {}),
        })
        .where(eq(this.sessions.id, record.id));
      return;
    }
    await this.db.insert(this.sessions).values(record);
  }

  async list(opts?: {
    limit?: number;
    offset?: number;
    cwd?: string;
    hasParentId?: boolean;
    excludeSessionIds?: string[];
  }): Promise<{ sessions: SessionRecord[]; total: number }> {
    const limit = opts?.limit ?? 50;
    const offset = opts?.offset ?? 0;

    const conditions = [ne(this.sessions.status, 'dead')];
    if (opts?.cwd) conditions.push(eq(this.sessions.cwd, opts.cwd));
    if (opts?.hasParentId) conditions.push(isNotNull(this.sessions.parentId));
    if (opts?.excludeSessionIds?.length) {
      conditions.push(notInArray(this.sessions.id, opts.excludeSessionIds));
    }
    const condition = conditions.length > 1 ? and(...conditions) : conditions[0];

    const rows = z
      .array(sessionRecordSchema)
      .parse(
        await this.db
          .select()
          .from(this.sessions)
          .where(condition)
          .orderBy(desc(this.sessions.createdAt))
          .limit(limit)
          .offset(offset),
      );

    const totalRows = await this.db.select({ count: count() }).from(this.sessions).where(condition);
    const totalResult = z.object({ count: z.number() }).optional().parse(totalRows[0]);

    return { sessions: rows, total: totalResult?.count ?? 0 };
  }

  async getById(id: string): Promise<SessionRecord | null> {
    const rows = await this.db.select().from(this.sessions).where(eq(this.sessions.id, id));
    return sessionRecordSchema.optional().parse(rows[0]) ?? null;
  }

  async getByChannelId(channelId: string): Promise<SessionRecord | null> {
    const rows = await this.db
      .select()
      .from(this.sessions)
      .where(eq(this.sessions.channelId, channelId));
    return sessionRecordSchema.optional().parse(rows[0]) ?? null;
  }

  private async withExistingId(id: string, op: () => Promise<unknown>): Promise<boolean> {
    if (!(await this.getById(id))) return false;
    await op();
    return true;
  }

  async rename(id: string, title: string): Promise<boolean> {
    return this.withExistingId(id, () =>
      this.db.update(this.sessions).set({ title }).where(eq(this.sessions.id, id)),
    );
  }

  async updateStatus(id: string, status: string): Promise<boolean> {
    return this.withExistingId(id, () =>
      this.db.update(this.sessions).set({ status }).where(eq(this.sessions.id, id)),
    );
  }

  async delete(id: string): Promise<boolean> {
    return this.withExistingId(id, () =>
      this.db.delete(this.sessions).where(eq(this.sessions.id, id)),
    );
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
