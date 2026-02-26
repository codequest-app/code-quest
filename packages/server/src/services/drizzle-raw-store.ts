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

interface EventsTable {
  sessionId: Column;
  dir: Column;
  type: Column;
  data: Column;
  createdAt: Column;
}

export class DrizzleRawStore implements RawEventStore {
  constructor(
    private db: DrizzleDb,
    private events: EventsTable,
  ) {}

  async append(entry: RawEntry): Promise<void> {
    await this.db.insert(this.events).values({
      sessionId: entry.sessionId,
      dir: entry.direction,
      type: entry.parsed?.[0]?.type ?? 'raw',
      data: JSON.stringify({
        raw: entry.raw,
        parsed: entry.parsed ?? null,
        turnId: entry.turnId,
      }),
      createdAt: new Date(entry.timestamp).toISOString(),
    });
  }

  async getBySession(sessionId: string): Promise<RawEntry[]> {
    const rows = await this.db
      .select()
      .from(this.events)
      .where(eq(this.events.sessionId, sessionId))
      .orderBy(asc(this.events.createdAt));

    return (rows as Record<string, unknown>[]).map((row) => {
      const data = JSON.parse(row.data as string);
      return {
        timestamp: new Date(row.createdAt as string).getTime(),
        sessionId: row.sessionId as string,
        turnId: data.turnId ?? 0,
        direction: row.dir as 'in' | 'out' | 'err',
        raw: data.raw,
        parsed: data.parsed ?? undefined,
      };
    });
  }
}
