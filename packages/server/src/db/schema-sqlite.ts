import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type {
  RawDeltaColumnName,
  RawEventColumnName,
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

export const rawEvents = sqliteTable(
  'raw_events',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull(),
    dir: text('dir').notNull(),
    raw: text('raw').notNull(),
    seq: integer('seq').notNull().default(0),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_raw_events_session_created').on(table.sessionId, table.createdAt, table.seq),
  ],
);

export const rawDeltas = sqliteTable(
  'raw_deltas',
  {
    id: text('id').primaryKey(),
    parentId: text('parent_id').notNull(),
    sessionId: text('session_id').notNull(),
    dir: text('dir').notNull(),
    raw: text('raw').notNull(),
    seq: integer('seq').notNull().default(0),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_raw_deltas_session_seq').on(table.sessionId, table.seq),
    index('idx_raw_deltas_parent').on(table.parentId),
  ],
);

// Compile-time check: column names must match shared definition
type _AssertSessionCols = keyof typeof sessions._.columns extends SessionColumnName ? true : never;
type _AssertRawEventCols = keyof typeof rawEvents._.columns extends RawEventColumnName
  ? true
  : never;
type _AssertRawDeltaCols = keyof typeof rawDeltas._.columns extends RawDeltaColumnName
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
const _rawEventCheck: _AssertRawEventCols = true;
const _rawDeltaCheck: _AssertRawDeltaCols = true;
type _AssertSettingsCols = keyof typeof settings._.columns extends SettingsColumnName
  ? true
  : never;
const _settingsCheck: _AssertSettingsCols = true;
void _sessionCheck;
void _rawEventCheck;
void _rawDeltaCheck;
void _settingsCheck;
