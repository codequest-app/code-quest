import { and, type Column, count, desc, eq, isNotNull, ne } from 'drizzle-orm';
import { z } from 'zod';
import type { DrizzleDb } from './drizzle-types.ts';
import { type SessionRecord, type SessionStore, sessionRecordSchema } from './session-store.ts';

interface SessionsTable {
  channelId: Column;
  provider: Column;
  command: Column;
  args: Column;
  cwd: Column;
  mode: Column;
  role: Column;
  parentId: Column;
  sessionId: Column;
  title: Column;
  status: Column;
  createdAt: Column;
}

export class DrizzleSessionStore implements SessionStore {
  constructor(
    private db: DrizzleDb,
    private sessions: SessionsTable,
  ) {}

  async persist(record: SessionRecord): Promise<void> {
    const existing = await this.getById(record.channelId);
    if (existing) return;
    await this.db.insert(this.sessions).values(record);
  }

  async list(opts?: {
    limit?: number;
    offset?: number;
    cwd?: string;
    hasParentId?: boolean;
  }): Promise<{ sessions: SessionRecord[]; total: number }> {
    const limit = opts?.limit ?? 50;
    const offset = opts?.offset ?? 0;

    const conditions = [ne(this.sessions.status, 'dead')];
    if (opts?.cwd) conditions.push(eq(this.sessions.cwd, opts.cwd));
    if (opts?.hasParentId) conditions.push(isNotNull(this.sessions.parentId));
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

  async getById(channelId: string): Promise<SessionRecord | null> {
    const rows = await this.db
      .select()
      .from(this.sessions)
      .where(eq(this.sessions.channelId, channelId));
    return sessionRecordSchema.optional().parse(rows[0]) ?? null;
  }

  async rename(channelId: string, title: string): Promise<boolean> {
    const existing = await this.getById(channelId);
    if (!existing) return false;
    await this.db
      .update(this.sessions)
      .set({ title })
      .where(eq(this.sessions.channelId, channelId));
    return true;
  }

  async updateStatus(channelId: string, status: string): Promise<boolean> {
    const existing = await this.getById(channelId);
    if (!existing) return false;
    await this.db
      .update(this.sessions)
      .set({ status })
      .where(eq(this.sessions.channelId, channelId));
    return true;
  }

  async delete(channelId: string): Promise<boolean> {
    const existing = await this.getById(channelId);
    if (!existing) return false;
    await this.db.delete(this.sessions).where(eq(this.sessions.channelId, channelId));
    return true;
  }
}
