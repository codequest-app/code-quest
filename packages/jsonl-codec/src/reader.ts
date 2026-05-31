import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { JsonlDecoder } from './decoder.ts';
import type { SessionData, SessionSource } from './types.ts';

export class JsonlReader implements SessionSource {
  private readonly jsonlPath: string;
  constructor(jsonlPath: string) {
    this.jsonlPath = jsonlPath;
  }

  async read(sessionId: string): Promise<SessionData> {
    const lines = await this.readLines();
    const decoder = new JsonlDecoder(sessionId);
    const events = lines.flatMap((l) => {
      const e = decoder.readLine(l);
      return e ? [e] : [];
    });
    const record = decoder.extractSessionRecord(lines);
    return { events, record };
  }

  private async readLines(): Promise<string[]> {
    const lines: string[] = [];
    await new Promise<void>((resolve, reject) => {
      const stream = createReadStream(this.jsonlPath, { encoding: 'utf-8' });
      const rl = createInterface({ input: stream, crlfDelay: Infinity });
      stream.on('error', reject);
      rl.on('line', (line) => {
        if (line.trim()) lines.push(line);
      });
      rl.on('close', resolve);
      rl.on('error', reject);
    });
    return lines;
  }
}
