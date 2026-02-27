import { index, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core';

export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  provider: varchar('provider', { length: 20 }).notNull(),
  command: varchar('command', { length: 255 }).notNull(),
  args: text('args').notNull(),
  cwd: text('cwd'),
  mode: varchar('mode', { length: 20 }).notNull().default('print'),
  role: varchar('role', { length: 20 }).notNull().default('chat'),
  parentId: varchar('parent_id', { length: 36 }),
  createdAt: varchar('created_at', { length: 30 }).notNull(),
});

export const rawEntries = mysqlTable(
  'raw_entries',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    sessionId: varchar('session_id', { length: 36 })
      .notNull()
      .references(() => sessions.id),
    promptId: varchar('prompt_id', { length: 36 }).notNull(),
    dir: varchar('dir', { length: 10 }).notNull(),
    raw: text('raw').notNull(),
    createdAt: varchar('created_at', { length: 30 }).notNull(),
  },
  (table) => [index('idx_raw_entries_session_created').on(table.sessionId, table.createdAt)],
);
