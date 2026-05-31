import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { JsonlWriter } from '@code-quest/jsonl-codec';
import type { RawEventService } from './raw-event-service.ts';
import type { SessionRecord, SessionStore } from './session-store.ts';

function parseJsonLine(line: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(line);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeEntry(
  entry: Record<string, unknown>,
  session: SessionRecord,
): Record<string, unknown> {
  const { session_id: _drop, ...rest } = entry;
  return {
    ...rest,
    sessionId: _drop ?? rest.sessionId ?? session.id,
    cwd: session.cwd,
    isSidechain: false,
  };
}

export class JsonlExporter {
  private readonly rawEventService: RawEventService;
  private readonly sessionStore: SessionStore;

  constructor(rawEventService: RawEventService, sessionStore: SessionStore) {
    this.rawEventService = rawEventService;
    this.sessionStore = sessionStore;
  }

  async exportSession(sessionId: string, outputPath: string): Promise<void> {
    const session = await this.sessionStore.getById(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const events = await this.rawEventService.getBySession(sessionId);
    const writer = new JsonlWriter();

    const lines: string[] = [];
    for (const event of events) {
      const line = writer.writeLine(event);
      if (!line) continue;
      const entry = parseJsonLine(line);
      if (!entry) continue;
      lines.push(JSON.stringify(normalizeEntry(entry, session)) + '\n');
    }

    await mkdir(dirname(outputPath), { recursive: true });
    await pipeline(Readable.from(lines), createWriteStream(outputPath, { encoding: 'utf-8' }));
  }
}
