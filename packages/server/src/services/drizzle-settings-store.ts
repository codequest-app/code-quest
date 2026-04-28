import { and, type Column, eq, inArray } from 'drizzle-orm';
import { logger } from '../logger.ts';
import type { DrizzleDb } from './drizzle-types.ts';
import type { SettingsStore } from './settings-store.ts';

interface SettingsTable {
  provider: Column;
  key: Column;
  value: Column;
}

function hasValue(row: unknown): row is { value: string } {
  return row != null && typeof row === 'object' && 'value' in row && typeof row.value === 'string';
}

function hasKeyValue(row: unknown): row is { key: string; value: string } {
  return hasValue(row) && 'key' in row && typeof row.key === 'string';
}

function parseJsonValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (err) {
    logger.debug(err, 'Failed to parse settings value as JSON');
    return raw;
  }
}

export class DrizzleSettingsStore implements SettingsStore {
  private db: DrizzleDb;
  private table: SettingsTable;
  constructor(db: DrizzleDb, table: SettingsTable) {
    this.db = db;
    this.table = table;
  }

  async get(provider: string, key: string): Promise<unknown> {
    const rows = await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.provider, provider), eq(this.table.key, key)));
    const row = rows[0];
    if (!hasValue(row)) return undefined;
    return parseJsonValue(row.value);
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
    for (const row of rows.filter(hasKeyValue)) {
      result[row.key] = parseJsonValue(row.value);
    }
    return result;
  }
}
