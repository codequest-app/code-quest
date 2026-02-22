import { createInsertSchema } from 'drizzle-zod';
import { events, sessions } from './schema-sqlite.ts';

export const insertSessionSchema = createInsertSchema(sessions);
export const insertEventSchema = createInsertSchema(events);
