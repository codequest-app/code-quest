import type { RawEvent } from '@code-quest/summoner';
import type { Column } from 'drizzle-orm';
import { and, asc, desc, eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';
import type { DrizzleDb } from './drizzle-types.ts';
import { extractTextFromRaw, type RawEventStore, type SessionPreview } from './raw-event-store.ts';

const rawEventRowSchema = z.object({
  sessionId: z.string(),
  dir: z.string(),
  raw: z.string(),
  seq: z.number(),
  createdAt: z.string(),
});

type RawEventRow = z.infer<typeof rawEventRowSchema>;

const directionSchema = z.enum(['in', 'out', 'err']);

interface RawEventsTable {
  id: Column;
  sessionId: Column;
  dir: Column;
  raw: Column;
  seq: Column;
  createdAt: Column;
}

interface RawDeltasTable {
  id: Column;
  parentId: Column;
  sessionId: Column;
  dir: Column;
  raw: Column;
  seq: Column;
  createdAt: Column;
}

/** Drizzle's select-builder chain supports .unionAll + .orderBy; our minimal
 *  DrizzleDb structural type omits those methods. This local shape narrows
 *  just enough to keep the UNION ALL call typechecked without leaking raw
 *  dialect types. */
interface UnionableSelectBuilder<T> {
  from(table: unknown): {
    where(cond: unknown): {
      unionAll(other: unknown): {
        orderBy(...cols: unknown[]): Promise<T[]>;
      };
    };
  };
}

function findText(rows: RawEventRow[], type: 'user' | 'assistant'): string | undefined {
  for (const row of rows) {
    const text = extractTextFromRaw(row.raw, type);
    if (text) return text;
  }
  return undefined;
}

function toRawEvent(row: RawEventRow): RawEvent {
  return {
    timestamp: new Date(row.createdAt).getTime(),
    sessionId: row.sessionId,
    direction: directionSchema.parse(row.dir),
    raw: row.raw,
    seq: row.seq,
  };
}

export class DrizzleRawEventStore implements RawEventStore {
  /**
   * @param deltaTable optional sibling table. When supplied, `getBySession`
   *   emits a SQL `UNION ALL` across raw_events + raw_deltas. Omitted for
   *   single-table scenarios (e.g. isolated unit tests).
   */
  constructor(
    private db: DrizzleDb,
    private table: RawEventsTable,
    private deltaTable?: RawDeltasTable,
  ) {}

  async append(event: RawEvent, id?: string): Promise<string> {
    const rowId = id ?? uuidv7();
    await this.db.insert(this.table).values({
      id: rowId,
      sessionId: event.sessionId,
      dir: event.direction,
      raw: event.raw,
      seq: event.seq,
      createdAt: new Date(event.timestamp).toISOString(),
    });
    return rowId;
  }

  async getPreview(sessionId: string): Promise<SessionPreview> {
    // Last 10 'out' rows because not every out event is an assistant message (init, status, etc.).
    const [lastOutRaw, firstInRaw] = await Promise.all([
      this.db
        .select()
        .from(this.table)
        .where(and(eq(this.table.sessionId, sessionId), eq(this.table.dir, 'out')))
        .orderBy(desc(this.table.seq))
        .limit(10),
      this.db
        .select()
        .from(this.table)
        .where(and(eq(this.table.sessionId, sessionId), eq(this.table.dir, 'in')))
        .orderBy(asc(this.table.seq))
        .limit(5),
    ]);

    return {
      lastAssistant: findText(z.array(rawEventRowSchema).parse(lastOutRaw), 'assistant'),
      firstUser: findText(z.array(rawEventRowSchema).parse(firstInRaw), 'user'),
    };
  }

  async cloneEvents(fromSessionId: string, toSessionId: string, ids?: string[]): Promise<void> {
    if (fromSessionId === toSessionId) {
      throw new Error('cloneEvents: source and destination sessionId must differ');
    }
    // Events-only read — deltas are debug data and don't belong to a fork.
    const rows = await this.getEventsBySession(fromSessionId);
    if (rows.length === 0) return;
    const values = rows.map((row, i) => ({
      id: ids?.[i] ?? uuidv7(),
      sessionId: toSessionId,
      dir: row.direction,
      raw: row.raw,
      seq: i + 1,
      createdAt: new Date(row.timestamp).toISOString(),
    }));
    await this.db.insert(this.table).values(values);
  }

  async getBySession(sessionId: string): Promise<RawEvent[]> {
    if (!this.deltaTable) return this.getEventsBySession(sessionId);
    const rows = await this.getUnionBySession(sessionId, this.deltaTable);
    return z.array(rawEventRowSchema).parse(rows).map(toRawEvent);
  }

  private getUnionBySession(sessionId: string, deltaTable: typeof this.table) {
    const selectCols = (table: typeof this.table) => ({
      sessionId: table.sessionId,
      dir: table.dir,
      raw: table.raw,
      seq: table.seq,
      createdAt: table.createdAt,
    });

    const builder = this.db.select as unknown as (
      cols: ReturnType<typeof selectCols>,
    ) => UnionableSelectBuilder<RawEventRow>;

    const eventsQ = builder
      .call(this.db, selectCols(this.table))
      .from(this.table)
      .where(eq(this.table.sessionId, sessionId));
    const deltasQ = builder
      .call(this.db, selectCols(deltaTable))
      .from(deltaTable)
      .where(eq(deltaTable.sessionId, sessionId));

    return eventsQ.unionAll(deltasQ).orderBy(asc(this.table.createdAt), asc(this.table.seq));
  }

  private async getEventsBySession(sessionId: string): Promise<RawEvent[]> {
    const rows = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.sessionId, sessionId))
      .orderBy(asc(this.table.createdAt), asc(this.table.seq));

    return z.array(rawEventRowSchema).parse(rows).map(toRawEvent);
  }
}
