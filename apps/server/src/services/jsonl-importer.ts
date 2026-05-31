import { basename } from 'node:path';
import { JsonlReader } from '@code-quest/jsonl-codec';
import { DbWriter } from './db-writer.ts';
import type { RawEventService } from './raw-event-service.ts';
import type { SessionStore } from './session-store.ts';

export async function importSession(
  jsonlPath: string,
  rawEventService: RawEventService,
  sessionStore: SessionStore,
): Promise<void> {
  const sessionId = basename(jsonlPath, '.jsonl');
  const data = await new JsonlReader(jsonlPath).read(sessionId);
  await new DbWriter(rawEventService, sessionStore).write(sessionId, data);
}
