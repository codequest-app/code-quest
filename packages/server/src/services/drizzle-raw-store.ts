import type { RawEntry } from '@code-quest/summoner';
import type { Column } from 'drizzle-orm';
import { asc, eq } from 'drizzle-orm';
import type { RawEventStore } from './raw-event-store.ts';

/**
 * Drizzle does not expose a shared base type across SQLite / MySQL dialects.
 * We define a minimal structural interface so the store works with both
 * without resorting to bare `any`.
 *
 * @see https://deepwiki.com/drizzle-team/drizzle-orm/2.2-query-building
 */
interface DrizzleDb {
  insert(table: unknown): { values(v: unknown): Promise<unknown> };
  select(): {
    from(table: unknown): {
      where(cond: unknown): { orderBy(...cols: unknown[]): Promise<unknown[]> };
    };
  };
}

interface RawEntriesTable {
  id: Column;
  sessionId: Column;
  promptId: Column;
  dir: Column;
  raw: Column;
  createdAt: Column;
}

export class DrizzleRawStore implements RawEventStore {
  constructor(
    private db: DrizzleDb,
    private table: RawEntriesTable,
  ) {}

  async append(entry: RawEntry): Promise<void> {
    await this.db.insert(this.table).values({
      id: crypto.randomUUID(),
      sessionId: entry.sessionId,
      promptId: entry.promptId,
      dir: entry.direction,
      raw: entry.raw,
      createdAt: new Date(entry.timestamp).toISOString(),
    });
  }

  async getBySession(sessionId: string): Promise<RawEntry[]> {
    const rows = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.sessionId, sessionId))
      .orderBy(asc(this.table.createdAt));

    return (rows as Record<string, unknown>[]).map((row) => ({
      timestamp: new Date(row.createdAt as string).getTime(),
      sessionId: row.sessionId as string,
      promptId: row.promptId as string,
      direction: row.dir as 'in' | 'out' | 'err',
      raw: row.raw as string,
    }));
  }
}
