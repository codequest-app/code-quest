import { and, type Column, eq, inArray } from 'drizzle-orm';
import type { SettingsStore } from './settings-store.ts';

interface SettingsTable {
  provider: Column;
  key: Column;
  value: Column;
}

interface DrizzleDb {
  insert(table: unknown): { values(v: unknown): Promise<unknown> };
  update(table: unknown): { set(values: unknown): { where(cond: unknown): Promise<unknown> } };
  delete(table: unknown): { where(cond: unknown): Promise<unknown> };
  select(cols?: unknown): {
    from(table: unknown): { where(cond: unknown): Promise<unknown[]> };
  };
}

export class DrizzleSettingsStore implements SettingsStore {
  constructor(
    private db: DrizzleDb,
    private table: SettingsTable,
  ) {}

  async get(provider: string, key: string): Promise<unknown> {
    const rows = await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.provider, provider), eq(this.table.key, key)));
    const row = rows[0] as { value: string } | undefined;
    if (!row) return undefined;
    try {
      return JSON.parse(row.value);
    } catch {
      return row.value;
    }
  }

  async set(provider: string, key: string, value: unknown): Promise<void> {
    const jsonValue = JSON.stringify(value);
    const existing = await this.get(provider, key);
    if (existing !== undefined) {
      await this.db
        .update(this.table)
        .set({ value: jsonValue })
        .where(and(eq(this.table.provider, provider), eq(this.table.key, key)));
    } else {
      await this.db.insert(this.table).values({ provider, key, value: jsonValue });
    }
  }

  async getMany(provider: string, keys: string[]): Promise<Record<string, unknown>> {
    if (keys.length === 0) return {};
    const rows = await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.provider, provider), inArray(this.table.key, keys)));
    const result: Record<string, unknown> = {};
    for (const row of rows as Array<{ key: string; value: string }>) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = row.value;
      }
    }
    return result;
  }
}
