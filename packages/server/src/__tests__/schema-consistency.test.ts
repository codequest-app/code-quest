import { getTableColumns } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { RAW_ENTRY_COLUMNS, SESSION_COLUMNS } from '../db/schema-columns.ts';
import * as mysqlSchema from '../db/schema-mysql.ts';
import * as sqliteSchema from '../db/schema-sqlite.ts';

describe('schema consistency', () => {
  it('sessions: sqlite and mysql have same column names', () => {
    const sqliteCols = Object.keys(getTableColumns(sqliteSchema.sessions)).sort();
    const mysqlCols = Object.keys(getTableColumns(mysqlSchema.sessions)).sort();
    expect(sqliteCols).toEqual(mysqlCols);
  });

  it('rawEntries: sqlite and mysql have same column names', () => {
    const sqliteCols = Object.keys(getTableColumns(sqliteSchema.rawEntries)).sort();
    const mysqlCols = Object.keys(getTableColumns(mysqlSchema.rawEntries)).sort();
    expect(sqliteCols).toEqual(mysqlCols);
  });

  it('sessions: column names match shared definition', () => {
    const sqliteCols = Object.keys(getTableColumns(sqliteSchema.sessions)).sort();
    expect(sqliteCols).toEqual([...SESSION_COLUMNS].sort());
  });

  it('rawEntries: column names match shared definition', () => {
    const sqliteCols = Object.keys(getTableColumns(sqliteSchema.rawEntries)).sort();
    expect(sqliteCols).toEqual([...RAW_ENTRY_COLUMNS].sort());
  });
});
