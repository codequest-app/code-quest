import type { Column } from 'drizzle-orm';
import type { SessionRecord, SessionStore } from './session-store.ts';

interface DrizzleDb {
  insert(table: unknown): { values(v: unknown): Promise<unknown> };
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
  createdAt: Column;
}

export class DrizzleSessionStore implements SessionStore {
  constructor(
    private db: DrizzleDb,
    private sessions: SessionsTable,
  ) {}

  async persist(record: SessionRecord): Promise<void> {
    await this.db.insert(this.sessions).values(record);
  }
}
