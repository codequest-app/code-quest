/**
 * Shared column name definitions for sessions and raw_entries tables.
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

export const RAW_ENTRY_COLUMNS = [
  'id',
  'sessionId',
  'promptId',
  'dir',
  'raw',
  'seq',
  'createdAt',
] as const;

export const SETTINGS_COLUMNS = ['provider', 'key', 'value'] as const;

export type SessionColumnName = (typeof SESSION_COLUMNS)[number];
export type RawEntryColumnName = (typeof RAW_ENTRY_COLUMNS)[number];
export type SettingsColumnName = (typeof SETTINGS_COLUMNS)[number];
