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

type DrizzleDb = {
  select(): { from(t: Table): { all(): Record<string, unknown>[] } };
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
    const rows = await sourceDb.select().from(from).all();
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
