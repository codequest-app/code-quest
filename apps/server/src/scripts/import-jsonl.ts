import { basename } from 'node:path';
import { sqliteMigrationsFolder, sqliteSchema } from '@code-quest/db-schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { config } from '../config.ts';
import { createContainer } from '../container.ts';
import { createDatabaseFromUrl, parseDatabaseType } from '../db/create-database.ts';
import { JsonlImporter } from '../services/jsonl-importer.ts';
import type { RawEventService } from '../services/raw-event-service.ts';
import type { SessionStore } from '../services/session-store.ts';
import { TYPES } from '../types.ts';

const jsonlPath = process.argv[2];
if (!jsonlPath) {
  console.error('Usage: tsx src/scripts/import-jsonl.ts <path-to-jsonl>');
  process.exit(1);
}

const sqliteUrl = config.database.find((url) => parseDatabaseType(url) === 'sqlite');
if (!sqliteUrl) throw new Error('No SQLite database configured');

const entry = createDatabaseFromUrl(sqliteUrl);
if (entry.type !== 'sqlite') throw new Error('Expected SQLite');
migrate(entry.db, { migrationsFolder: sqliteMigrationsFolder });

const container = createContainer({
  storeConfig: { databases: [{ ...entry, schema: sqliteSchema }] },
  rawEvents: { writeDeltas: false, readDeltas: false },
});

const rawEventService = container.get<RawEventService>(TYPES.RawEventService);
const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
const importer = new JsonlImporter(rawEventService, sessionStore);

console.log(`Importing: ${jsonlPath}`);
await importer.importFile(jsonlPath);

const sessionId = basename(jsonlPath, '.jsonl');
if (!sessionId) {
  console.error('Could not extract sessionId from path');
  process.exit(1);
}
const events = await rawEventService.getBySession(sessionId);
const session = await sessionStore.getById(sessionId);

console.log(`✓ session: ${session?.id}`);
console.log(`✓ cwd: ${session?.cwd}`);
console.log(`✓ raw_events: ${events.length}`);
