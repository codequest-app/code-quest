import { asc, type Column, eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';
import type { DrizzleDb } from './drizzle-types.ts';
import type { RawDeltaEntry, RawDeltaStore } from './raw-delta-store.ts';

const rowSchema = z.object({
  parentId: z.string(),
  sessionId: z.string(),
  dir: z.string(),
  raw: z.string(),
  seq: z.number(),
  createdAt: z.string(),
});

const directionSchema = z.enum(['in', 'out', 'err']);

interface RawDeltasTable {
  id: Column;
  parentId: Column;
  sessionId: Column;
  dir: Column;
  raw: Column;
  seq: Column;
  createdAt: Column;
}

export class DrizzleRawDeltaStore implements RawDeltaStore {
  private db: DrizzleDb;
  private table: RawDeltasTable;
  constructor(db: DrizzleDb, table: RawDeltasTable) {
    this.db = db;
    this.table = table;
  }

  async append(event: RawDeltaEntry): Promise<void> {
    await this.db.insert(this.table).values({
      id: uuidv7(),
      parentId: event.parentId,
      sessionId: event.sessionId,
      dir: event.direction,
      raw: event.raw,
      seq: event.seq,
      createdAt: new Date(event.timestamp).toISOString(),
    });
  }

  async getBySession(sessionId: string): Promise<RawDeltaEntry[]> {
    const rows = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.sessionId, sessionId))
      .orderBy(asc(this.table.createdAt), asc(this.table.seq));

    return z
      .array(rowSchema)
      .parse(rows)
      .map((row) => ({
        parentId: row.parentId,
        sessionId: row.sessionId,
        direction: directionSchema.parse(row.dir),
        raw: row.raw,
        seq: row.seq,
        timestamp: new Date(row.createdAt).getTime(),
      }));
  }
}
