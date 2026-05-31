import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { JsonlEncoder } from './encoder.ts';
import type { SessionData, SessionSink } from './types.ts';

export class JsonlWriter implements SessionSink {
  private readonly outputPath: string;
  constructor(outputPath: string) {
    this.outputPath = outputPath;
  }

  async write(sessionId: string, data: SessionData): Promise<void> {
    const encoder = new JsonlEncoder();
    const { cwd } = data.record;
    const lines = data.events.flatMap((e) => {
      const raw = encoder.writeLine(e);
      if (!raw) return [];
      try {
        const entry = JSON.parse(raw) as Record<string, unknown>;
        entry.sessionId = sessionId;
        if (cwd) entry.cwd = cwd;
        return [`${JSON.stringify(entry)}\n`];
      } catch {
        return [];
      }
    });
    await mkdir(dirname(this.outputPath), { recursive: true });
    await pipeline(Readable.from(lines), createWriteStream(this.outputPath, { encoding: 'utf-8' }));
  }
}
