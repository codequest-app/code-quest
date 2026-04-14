import type { RawEntry } from '@code-quest/summoner';
import type { Column } from 'drizzle-orm';
import { and, asc, desc, eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';
import type { DrizzleDb } from './drizzle-types.ts';
import { extractTextFromRaw, type RawEventStore, type SessionPreview } from './raw-event-store.ts';

const rawEntryRowSchema = z.object({
  sessionId: z.string(),
  promptId: z.string(),
  dir: z.string(),
  raw: z.string(),
  seq: z.number(),
  createdAt: z.string(),
});

type RawEntryRow = z.infer<typeof rawEntryRowSchema>;

const directionSchema = z.enum(['in', 'out', 'err']);

interface RawEntriesTable {
  id: Column;
  sessionId: Column;
  promptId: Column;
  dir: Column;
  raw: Column;
  seq: Column;
  createdAt: Column;
}

function findText(rows: RawEntryRow[], type: 'user' | 'assistant'): string | undefined {
  for (const row of rows) {
    const text = extractTextFromRaw(row.raw, type);
    if (text) return text;
  }
  return undefined;
}

export class DrizzleRawStore implements RawEventStore {
  constructor(
    private db: DrizzleDb,
    private table: RawEntriesTable,
  ) {}

  async append(entry: RawEntry): Promise<void> {
    await this.db.insert(this.table).values({
      id: uuidv7(),
      sessionId: entry.sessionId,
      promptId: entry.promptId,
      dir: entry.direction,
      raw: entry.raw,
      seq: entry.seq,
      createdAt: new Date(entry.timestamp).toISOString(),
    });
  }

  // Query last 10 'out' entries — not all are assistant (init, status, etc.), so we scan a few
  async getPreview(sessionId: string): Promise<SessionPreview> {
    const lastOutRows = z.array(rawEntryRowSchema).parse(
      await this.db
        .select()
        .from(this.table)
        .where(and(eq(this.table.sessionId, sessionId), eq(this.table.dir, 'out')))
        .orderBy(desc(this.table.seq))
        .limit(10),
    );

    // First 'in' entry is the first user message
    const firstInRows = z.array(rawEntryRowSchema).parse(
      await this.db
        .select()
        .from(this.table)
        .where(and(eq(this.table.sessionId, sessionId), eq(this.table.dir, 'in')))
        .orderBy(asc(this.table.seq))
        .limit(5),
    );

    return {
      lastAssistant: findText(lastOutRows, 'assistant'),
      firstUser: findText(firstInRows, 'user'),
    };
  }

  async cloneEvents(fromSessionId: string, toSessionId: string): Promise<void> {
    if (fromSessionId === toSessionId) {
      throw new Error('cloneEvents: source and destination sessionId must differ');
    }
    const rows = await this.getBySession(fromSessionId);
    if (rows.length === 0) return;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      await this.db.insert(this.table).values({
        id: uuidv7(),
        sessionId: toSessionId,
        promptId: row.promptId,
        dir: row.direction,
        raw: row.raw,
        seq: i + 1,
        createdAt: new Date(row.timestamp).toISOString(),
      });
    }
  }

  async getBySession(sessionId: string): Promise<RawEntry[]> {
    const rows = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.sessionId, sessionId))
      .orderBy(asc(this.table.createdAt), asc(this.table.seq));

    return z
      .array(rawEntryRowSchema)
      .parse(rows)
      .map((row) => ({
        timestamp: new Date(row.createdAt).getTime(),
        sessionId: row.sessionId,
        promptId: row.promptId,
        direction: directionSchema.parse(row.dir),
        raw: row.raw,
        seq: row.seq,
      }));
  }
}
