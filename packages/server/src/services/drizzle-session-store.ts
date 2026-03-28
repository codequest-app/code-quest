import { type Column, count, desc, eq, ne } from 'drizzle-orm';
import type { SessionRecord, SessionStore } from './session-store.ts';

interface DrizzleQueryResult extends Promise<unknown[]> {
  orderBy(...cols: unknown[]): { limit(n: number): { offset(n: number): Promise<unknown[]> } };
}

interface DrizzleDb {
  insert(table: unknown): { values(v: unknown): Promise<unknown> };
  select(cols?: unknown): {
    from(table: unknown): {
      where(cond: unknown): DrizzleQueryResult;
    };
  };
  update(table: unknown): {
    set(values: unknown): { where(cond: unknown): Promise<unknown> };
  };
  delete(table: unknown): { where(cond: unknown): Promise<unknown> };
}

interface SessionsTable {
  id: Column;
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
    const existing = await this.getById(record.id);
    if (existing) return;
    await this.db.insert(this.sessions).values(record);
  }

  async list(opts?: {
    limit?: number;
    offset?: number;
  }): Promise<{ sessions: SessionRecord[]; total: number }> {
    const limit = opts?.limit ?? 50;
    const offset = opts?.offset ?? 0;

    const rows = (await this.db
      .select()
      .from(this.sessions)
      .where(ne(this.sessions.status, 'dead'))
      .orderBy(desc(this.sessions.createdAt))
      .limit(limit)
      .offset(offset)) as SessionRecord[];

    const totalRows = await this.db
      .select({ count: count() })
      .from(this.sessions)
      .where(ne(this.sessions.status, 'dead'));
    const totalResult = totalRows[0] as { count: number } | undefined;

    return { sessions: rows, total: totalResult?.count ?? 0 };
  }

  async getById(id: string): Promise<SessionRecord | null> {
    const rows = await this.db.select().from(this.sessions).where(eq(this.sessions.id, id));
    return (rows[0] as SessionRecord) ?? null;
  }

  async rename(id: string, title: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;
    await this.db.update(this.sessions).set({ title }).where(eq(this.sessions.id, id));
    return true;
  }

  async updateStatus(id: string, status: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;
    await this.db.update(this.sessions).set({ status }).where(eq(this.sessions.id, id));
    return true;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;
    await this.db.delete(this.sessions).where(eq(this.sessions.id, id));
    return true;
  }
}
