import { JsonlWriter } from '@code-quest/jsonl-codec';
import { DbReader } from './db-reader.ts';
import type { RawEventService } from './raw-event-service.ts';
import type { SessionStore } from './session-store.ts';

export async function exportSession(
  sessionId: string,
  outputPath: string,
  rawEventService: RawEventService,
  sessionStore: SessionStore,
): Promise<void> {
  const data = await new DbReader(rawEventService, sessionStore).read(sessionId);
  await new JsonlWriter(outputPath).write(sessionId, data);
}
