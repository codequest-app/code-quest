import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  command: text('command').notNull(),
  args: text('args').notNull(),
  cwd: text('cwd'),
  mode: text('mode').notNull().default('print'),
  createdAt: text('created_at').notNull(),
});

export const events = sqliteTable(
  'events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id),
    dir: text('dir').notNull(),
    type: text('type').notNull(),
    data: text('data').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_events_session_created').on(table.sessionId, table.createdAt)],
);
