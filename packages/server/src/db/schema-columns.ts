/**
 * Shared column name definitions for sessions, raw_events, raw_deltas tables.
 * Both SQLite and MySQL schemas must use exactly these column names.
 * The consistency test in schema-consistency.test.ts verifies this at test time.
 */

export const SESSION_COLUMNS = [
  'id',
  'parentId',
  'channelId',
  'provider',
  'command',
  'args',
  'cwd',
  'projectRoot',
  'mode',
  'role',
  'title',
  'status',
  'createdAt',
] as const;

export const RAW_EVENT_COLUMNS = ['id', 'sessionId', 'dir', 'raw', 'seq', 'createdAt'] as const;

export const RAW_DELTA_COLUMNS = [
  'id',
  'parentId',
  'sessionId',
  'dir',
  'raw',
  'seq',
  'createdAt',
] as const;

export const SETTINGS_COLUMNS = ['provider', 'key', 'value'] as const;

export const PROJECT_COLUMNS = [
  'id',
  'path',
  'name',
  'pinned',
  'color',
  'lastOpenedAt',
  'createdAt',
] as const;

export type SessionColumnName = (typeof SESSION_COLUMNS)[number];
export type RawEventColumnName = (typeof RAW_EVENT_COLUMNS)[number];
export type RawDeltaColumnName = (typeof RAW_DELTA_COLUMNS)[number];
export type SettingsColumnName = (typeof SETTINGS_COLUMNS)[number];
export type ProjectColumnName = (typeof PROJECT_COLUMNS)[number];
