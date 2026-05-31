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

// Keep class for backwards compatibility with existing tests and scripts
export class JsonlExporter {
  private readonly rawEventService: RawEventService;
  private readonly sessionStore: SessionStore;
  constructor(rawEventService: RawEventService, sessionStore: SessionStore) {
    this.rawEventService = rawEventService;
    this.sessionStore = sessionStore;
  }

  exportSession(sessionId: string, outputPath: string): Promise<void> {
    return exportSession(sessionId, outputPath, this.rawEventService, this.sessionStore);
  }
}
