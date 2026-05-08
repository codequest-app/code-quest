import type { Table } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

interface TableMapping {
  name: string;
  from: Table;
  to: Table;
}

interface SyncResult {
  name: string;
  count: number;
}

export async function syncTables(
  sourceDb: { select: () => { from: (t: Table) => { all: () => Record<string, unknown>[] } } },
  targetDb: {
    run: (q: ReturnType<typeof sql>) => void;
    insert: (t: Table) => { values: (v: unknown[]) => { run: () => void } };
    transaction: <T>(fn: (tx: typeof targetDb) => T) => T;
  },
  tables: readonly TableMapping[],
): Promise<SyncResult[]> {
  const sourceRows = new Map<string, Record<string, unknown>[]>();
  for (const { name, from } of tables) {
    sourceRows.set(name, await sourceDb.select().from(from).all());
  }

  const results: SyncResult[] = [];

  targetDb.transaction((tx) => {
    for (const { name, to } of tables) {
      const rows = sourceRows.get(name) ?? [];
      if (rows.length === 0) {
        results.push({ name, count: 0 });
        continue;
      }

      tx.run(sql`DELETE FROM ${to}`);
      const BATCH = 500;
      for (let i = 0; i < rows.length; i += BATCH) {
        tx.insert(to)
          .values(rows.slice(i, i + BATCH))
          .run();
      }
      results.push({ name, count: rows.length });
    }
  });

  return results;
}
