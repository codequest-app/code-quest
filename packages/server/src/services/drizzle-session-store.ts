import type { SessionRecord, SessionStore } from './session-store.ts';

interface DrizzleDb {
  insert(table: unknown): { values(v: unknown): Promise<unknown> };
}

export class DrizzleSessionStore implements SessionStore {
  constructor(
    private db: DrizzleDb,
    private sessions: unknown,
  ) {}

  async persist(record: SessionRecord): Promise<void> {
    await this.db.insert(this.sessions).values(record);
  }
}
