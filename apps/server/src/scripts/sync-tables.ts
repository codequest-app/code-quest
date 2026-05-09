import type { Table } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const BATCH_SIZE = 500;

interface TableMapping {
  name: string;
  from: Table;
  to: Table;
}

interface SyncResult {
  name: string;
  count: number;
}

type SelectResult = Record<string, unknown>[] | { all(): Record<string, unknown>[] };

type DrizzleDb = {
  select(): { from(t: Table): SelectResult | Promise<SelectResult> };
  run(q: ReturnType<typeof sql>): void;
  insert(t: Table): { values(v: unknown[]): { run(): void } };
  transaction<T>(fn: (tx: DrizzleDb) => T): T;
};

export async function syncTables(
  sourceDb: DrizzleDb,
  targetDb: DrizzleDb,
  tables: readonly TableMapping[],
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  for (const { name, from, to } of tables) {
    const result = await sourceDb.select().from(from);
    const rows = Array.isArray(result) ? result : result.all();
    if (rows.length === 0) {
      results.push({ name, count: 0 });
      continue;
    }

    targetDb.transaction((tx) => {
      tx.run(sql`DELETE FROM ${to}`);
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        tx.insert(to)
          .values(rows.slice(i, i + BATCH_SIZE))
          .run();
      }
    });
    results.push({ name, count: rows.length });
  }

  return results;
}
