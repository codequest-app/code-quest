import { index, int, mysqlTable, primaryKey, text, varchar } from 'drizzle-orm/mysql-core';
import type {
  RawEntryColumnName,
  SessionColumnName,
  SettingsColumnName,
} from './schema-columns.ts';

export const sessions = mysqlTable(
  'sessions',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    channelId: varchar('channel_id', { length: 36 }),
    provider: varchar('provider', { length: 20 }).notNull(),
    command: varchar('command', { length: 255 }).notNull(),
    args: text('args').notNull(),
    cwd: text('cwd'),
    mode: varchar('mode', { length: 20 }).notNull().default('print'),
    role: varchar('role', { length: 20 }).notNull().default('chat'),
    parentId: varchar('parent_id', { length: 36 }),
    title: varchar('title', { length: 200 }),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    createdAt: varchar('created_at', { length: 30 }).notNull(),
  },
  (table) => [index('idx_sessions_channel_id').on(table.channelId)],
);

export const rawEntries = mysqlTable(
  'raw_entries',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    sessionId: varchar('session_id', { length: 36 }).notNull(),
    promptId: varchar('prompt_id', { length: 36 }).notNull(),
    dir: varchar('dir', { length: 10 }).notNull(),
    raw: text('raw').notNull(),
    seq: int('seq').notNull().default(0),
    createdAt: varchar('created_at', { length: 30 }).notNull(),
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
export const settings = mysqlTable(
  'settings',
  {
    provider: varchar('provider', { length: 20 }).notNull(),
    key: varchar('key', { length: 100 }).notNull(),
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
