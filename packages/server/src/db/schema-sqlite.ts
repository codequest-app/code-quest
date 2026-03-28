import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { RawEntryColumnName, SessionColumnName } from './schema-columns.ts';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  command: text('command').notNull(),
  args: text('args').notNull(),
  cwd: text('cwd'),
  mode: text('mode').notNull().default('print'),
  role: text('role').notNull().default('chat'),
  parentId: text('parent_id'),
  sessionId: text('session_id'),
  title: text('title'),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at').notNull(),
});

export const rawEntries = sqliteTable(
  'raw_entries',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull(),
    promptId: text('prompt_id').notNull(),
    dir: text('dir').notNull(),
    raw: text('raw').notNull(),
    seq: integer('seq').notNull().default(0),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_raw_entries_session_created').on(table.sessionId, table.createdAt, table.seq),
  ],
);

// Compile-time check: column names must match shared definition
type _AssertSessionCols = keyof typeof sessions._.columns extends SessionColumnName ? true : never;
type _AssertRawEntryCols = keyof typeof rawEntries._.columns extends RawEntryColumnName
  ? true
  : never;
const _sessionCheck: _AssertSessionCols = true;
const _rawEntryCheck: _AssertRawEntryCols = true;
void _sessionCheck;
void _rawEntryCheck;
