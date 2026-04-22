import {
  index,
  int,
  mediumtext,
  mysqlTable,
  primaryKey,
  text,
  varchar,
} from 'drizzle-orm/mysql-core';
import type {
  RawDeltaColumnName,
  RawEventColumnName,
  SessionColumnName,
  SettingsColumnName,
} from './schema-columns.ts';

export const sessions = mysqlTable(
  'sessions',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    parentId: varchar('parent_id', { length: 36 }),
    channelId: varchar('channel_id', { length: 36 }),
    provider: varchar('provider', { length: 20 }).notNull(),
    command: varchar('command', { length: 255 }).notNull(),
    args: text('args').notNull(),
    cwd: text('cwd'),
    projectRoot: text('project_root').notNull(),
    mode: varchar('mode', { length: 20 }).notNull().default('print'),
    role: varchar('role', { length: 20 }).notNull().default('chat'),
    title: varchar('title', { length: 200 }),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    createdAt: varchar('created_at', { length: 30 }).notNull(),
  },
  (table) => [index('idx_sessions_channel_id').on(table.channelId)],
);

export const rawEvents = mysqlTable(
  'raw_events',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    sessionId: varchar('session_id', { length: 36 }).notNull(),
    dir: varchar('dir', { length: 10 }).notNull(),
    raw: mediumtext('raw').notNull(),
    seq: int('seq').notNull().default(0),
    createdAt: varchar('created_at', { length: 30 }).notNull(),
  },
  (table) => [
    index('idx_raw_events_session_created').on(table.sessionId, table.createdAt, table.seq),
  ],
);

export const rawDeltas = mysqlTable(
  'raw_deltas',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    parentId: varchar('parent_id', { length: 36 }).notNull(),
    sessionId: varchar('session_id', { length: 36 }).notNull(),
    dir: varchar('dir', { length: 10 }).notNull(),
    raw: mediumtext('raw').notNull(),
    seq: int('seq').notNull().default(0),
    createdAt: varchar('created_at', { length: 30 }).notNull(),
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
