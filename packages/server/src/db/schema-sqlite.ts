import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  command: text('command').notNull(),
  args: text('args').notNull(),
  cwd: text('cwd'),
  mode: text('mode').notNull().default('print'),
  role: text('role').notNull().default('chat'),
  parentId: text('parent_id'),
  createdAt: text('created_at').notNull(),
});

export const rawEntries = sqliteTable(
  'raw_entries',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id),
    promptId: text('prompt_id').notNull(),
    dir: text('dir').notNull(),
    raw: text('raw').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_raw_entries_session_created').on(table.sessionId, table.createdAt)],
);
