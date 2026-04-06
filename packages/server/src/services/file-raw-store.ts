import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type RawEntry, rawEntrySchema } from '@code-quest/summoner';
import { extractTextFromRaw, type RawEventStore, type SessionPreview } from './raw-event-store.ts';

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
        .map((line) => rawEntrySchema.parse(JSON.parse(line)));
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  async getPreview(sessionId: string): Promise<SessionPreview> {
    validateSessionId(sessionId);
    const entries = await this.getBySession(sessionId);
    let lastAssistant: string | undefined;
    let firstUser: string | undefined;

    for (const entry of entries) {
      if (!firstUser && entry.direction === 'in') {
        firstUser = extractTextFromRaw(entry.raw, 'user');
      }
    }
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].direction === 'out') {
        const text = extractTextFromRaw(entries[i].raw, 'assistant');
        if (text) {
          lastAssistant = text;
          break;
        }
      }
    }

    return { lastAssistant, firstUser };
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
