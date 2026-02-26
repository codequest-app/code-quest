import { index, int, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core';

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

export const events = mysqlTable(
  'events',
  {
    id: int('id').primaryKey().autoincrement(),
    sessionId: varchar('session_id', { length: 36 })
      .notNull()
      .references(() => sessions.id),
    dir: varchar('dir', { length: 10 }).notNull(),
    type: varchar('type', { length: 100 }).notNull(),
    data: text('data').notNull(),
    createdAt: varchar('created_at', { length: 30 }).notNull(),
  },
  (table) => [index('idx_events_session_created').on(table.sessionId, table.createdAt)],
);
