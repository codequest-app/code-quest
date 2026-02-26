import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RawEntry } from '@code-quest/summoner';
import type { RawEventStore } from './raw-event-store.ts';

const SAFE_SESSION_ID = /^[a-zA-Z0-9_-]+$/;

export class FileRawStore implements RawEventStore {
  private dirReady: Promise<void> | null = null;

  constructor(private dir: string) {}

  async append(entry: RawEntry): Promise<void> {
    validateSessionId(entry.sessionId);
    await this.ensureDir();
    const filePath = join(this.dir, `${entry.sessionId}.jsonl`);
    await appendFile(filePath, `${JSON.stringify(entry)}\n`);
  }

  async getBySession(sessionId: string): Promise<RawEntry[]> {
    validateSessionId(sessionId);
    const filePath = join(this.dir, `${sessionId}.jsonl`);
    try {
      const content = await readFile(filePath, 'utf-8');
      return content
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => JSON.parse(line) as RawEntry);
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  private ensureDir(): Promise<void> {
    if (!this.dirReady) {
      this.dirReady = mkdir(this.dir, { recursive: true }).then(() => {});
    }
    return this.dirReady;
  }
}

function validateSessionId(sessionId: string): void {
  if (!SAFE_SESSION_ID.test(sessionId)) {
    throw new Error(`Invalid sessionId: ${sessionId}`);
  }
}
