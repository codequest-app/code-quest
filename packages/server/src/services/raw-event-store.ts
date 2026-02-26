import type { RawEntry } from '@code-quest/summoner';
import { eq } from 'drizzle-orm';
import { inject, injectable } from 'inversify';
import type { DrizzleDatabase } from '../db/client.ts';
import { events } from '../db/schema.ts';
import { TYPES } from '../types.ts';

export interface RawEventStore {
  append(entry: RawEntry): Promise<void>;
  getBySession(sessionId: string): Promise<RawEntry[]>;
}

@injectable()
export class SqliteRawStore implements RawEventStore {
  constructor(@inject(TYPES.Database) private db: DrizzleDatabase) {}

  async append(entry: RawEntry): Promise<void> {
    await this.db.insert(events).values({
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
    const rows = await this.db.select().from(events).where(eq(events.sessionId, sessionId));

    return rows.map((row) => {
      const data = JSON.parse(row.data);
      return {
        timestamp: new Date(row.createdAt).getTime(),
        sessionId: row.sessionId,
        turnId: data.turnId ?? 0,
        direction: row.dir as 'in' | 'out' | 'err',
        raw: data.raw,
        parsed: data.parsed ?? undefined,
      };
    });
  }
}
