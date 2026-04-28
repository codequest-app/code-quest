import {
  mysqlSchema,
  RAW_EVENT_COLUMNS,
  SESSION_COLUMNS,
  sqliteSchema,
} from '@code-quest/db-schema';
import { getTableColumns } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

describe('schema consistency', () => {
  it('sessions: sqlite and mysql have same column names', () => {
    const sqliteCols = Object.keys(getTableColumns(sqliteSchema.sessions)).sort();
    const mysqlCols = Object.keys(getTableColumns(mysqlSchema.sessions)).sort();
    expect(sqliteCols).toEqual(mysqlCols);
  });

  it('rawEvents: sqlite and mysql have same column names', () => {
    const sqliteCols = Object.keys(getTableColumns(sqliteSchema.rawEvents)).sort();
    const mysqlCols = Object.keys(getTableColumns(mysqlSchema.rawEvents)).sort();
    expect(sqliteCols).toEqual(mysqlCols);
  });

  it('sessions: column names match shared definition', () => {
    const sqliteCols = Object.keys(getTableColumns(sqliteSchema.sessions)).sort();
    expect(sqliteCols).toEqual([...SESSION_COLUMNS].sort());
  });

  it('rawEvents: column names match shared definition', () => {
    const sqliteCols = Object.keys(getTableColumns(sqliteSchema.rawEvents)).sort();
    expect(sqliteCols).toEqual([...RAW_EVENT_COLUMNS].sort());
  });
});
