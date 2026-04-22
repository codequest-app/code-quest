import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type {
  RawEntryColumnName,
  SessionColumnName,
  SettingsColumnName,
} from './schema-columns.ts';

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    parentId: text('parent_id'),
    channelId: text('channel_id'),
    provider: text('provider').notNull(),
    command: text('command').notNull(),
    args: text('args').notNull(),
    cwd: text('cwd'),
    projectRoot: text('project_root').notNull(),
    mode: text('mode').notNull().default('print'),
    role: text('role').notNull().default('chat'),
    title: text('title'),
    status: text('status').notNull().default('active'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_sessions_channel_id').on(table.channelId)],
);

export const rawEntries = sqliteTable(
  'raw_entries',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull(),
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
export const settings = sqliteTable(
  'settings',
  {
    provider: text('provider').notNull(),
    key: text('key').notNull(),
    value: text('value').notNull(),
  },
  (table) => [primaryKey({ columns: [table.provider, table.key] })],
);

const _sessionCheck: _AssertSessionCols = true;
const _rawEntryCheck: _AssertRawEntryCols = true;
type _AssertSettingsCols = keyof typeof settings._.columns extends SettingsColumnName
  ? true
  : never;
const _settingsCheck: _AssertSettingsCols = true;
void _sessionCheck;
void _rawEntryCheck;
void _settingsCheck;
