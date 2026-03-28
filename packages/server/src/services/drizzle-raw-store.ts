import type { RawEntry } from '@code-quest/summoner';
import type { Column } from 'drizzle-orm';
import { and, asc, desc, eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import type { RawEventStore, SessionPreview } from './raw-event-store.ts';

/**
 * Drizzle does not expose a shared base type across SQLite / MySQL dialects.
 * We define a minimal structural interface so the store works with both
 * without resorting to bare `any`.
 *
 * @see https://deepwiki.com/drizzle-team/drizzle-orm/2.2-query-building
 */
interface RawEntryRow {
  sessionId: string;
  promptId: string;
  dir: string;
  raw: string;
  seq: number;
  createdAt: string;
}

interface DrizzleDb {
  insert(table: unknown): { values(v: unknown): Promise<unknown> };
  select(): {
    from(table: unknown): {
      where(cond: unknown): {
        orderBy(...cols: unknown[]): {
          limit(n: number): Promise<unknown[]>;
        } & Promise<unknown[]>;
      };
    };
  };
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

function extractText(rows: RawEntryRow[], type: 'user' | 'assistant'): string | undefined {
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.raw);
      if (parsed.type !== type) continue;
      const content = parsed.message?.content;
      if (Array.isArray(content)) {
        const textBlock = content.find((b: { type: string }) => b.type === 'text');
        if (textBlock?.text) return textBlock.text;
      }
    } catch {}
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

  async getPreview(sessionId: string): Promise<SessionPreview> {
    const firstUserRows = (await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.sessionId, sessionId), eq(this.table.dir, 'in')))
      .orderBy(asc(this.table.seq))
      .limit(10)) as RawEntryRow[];

    const lastAssistantRows = (await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.sessionId, sessionId), eq(this.table.dir, 'out')))
      .orderBy(desc(this.table.seq))
      .limit(10)) as RawEntryRow[];

    return {
      firstUser: extractText(firstUserRows, 'user'),
      lastAssistant: extractText(lastAssistantRows, 'assistant'),
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
