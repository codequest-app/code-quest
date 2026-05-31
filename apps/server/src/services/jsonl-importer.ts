import { createReadStream } from 'node:fs';
import { basename } from 'node:path';
import { createInterface } from 'node:readline';
import { JsonlReader } from '@code-quest/jsonl-codec';
import type { RawEventService } from './raw-event-service.ts';
import type { SessionStore } from './session-store.ts';

export class JsonlImporter {
  private readonly rawEventService: RawEventService;
  private readonly sessionStore: SessionStore;

  constructor(rawEventService: RawEventService, sessionStore: SessionStore) {
    this.rawEventService = rawEventService;
    this.sessionStore = sessionStore;
  }

  async importFile(jsonlPath: string): Promise<void> {
    const sessionId = basename(jsonlPath, '.jsonl');

    const existing = await this.rawEventService.getBySession(sessionId);
    if (existing.length > 0) return;

    const reader = new JsonlReader(sessionId);
    const lines: string[] = [];

    await new Promise<void>((resolve, reject) => {
      const stream = createReadStream(jsonlPath, { encoding: 'utf-8' });
      const rl = createInterface({ input: stream, crlfDelay: Infinity });
      stream.on('error', reject);
      rl.on('line', (line) => {
        if (line.trim()) lines.push(line);
      });
      rl.on('close', resolve);
      rl.on('error', reject);
    });

    const sessionRecord = reader.extractSessionRecord(lines);
    await this.sessionStore.upsert(sessionRecord);

    for (const line of lines) {
      const event = reader.readLine(line);
      if (event) await this.rawEventService.appendEvent(event);
    }
  }
}
