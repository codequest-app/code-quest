import type { RawEntry } from '@code-quest/summoner';
import type { Column } from 'drizzle-orm';
import { and, asc, desc, eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import type { DrizzleDb } from './drizzle-types.ts';
import { extractTextFromRaw, type RawEventStore, type SessionPreview } from './raw-event-store.ts';

interface RawEntryRow {
  sessionId: string;
  promptId: string;
  dir: string;
  raw: string;
  seq: number;
  createdAt: string;
}

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
    const lastOutRows = (await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.sessionId, sessionId), eq(this.table.dir, 'out')))
      .orderBy(desc(this.table.seq))
      .limit(10)) as RawEntryRow[];

    // First 'in' entry is the first user message
    const firstInRows = (await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.sessionId, sessionId), eq(this.table.dir, 'in')))
      .orderBy(asc(this.table.seq))
      .limit(5)) as RawEntryRow[];

    return {
      lastAssistant: findText(lastOutRows, 'assistant'),
      firstUser: findText(firstInRows, 'user'),
    };
  }

  async getBySession(sessionId: string): Promise<RawEntry[]> {
    const rows = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.sessionId, sessionId))
      .orderBy(asc(this.table.createdAt), asc(this.table.seq));

    return (rows as RawEntryRow[]).map((row) => ({
      timestamp: new Date(row.createdAt).getTime(),
      sessionId: row.sessionId,
      promptId: row.promptId,
      direction: row.dir as 'in' | 'out' | 'err',
      raw: row.raw,
      seq: row.seq,
    }));
  }
}
