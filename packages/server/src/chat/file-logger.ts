import fs from 'node:fs';
import path from 'node:path';
import { injectable } from 'inversify';
import type { ChatLogEntry, ChatLogger } from './logger.ts';

@injectable()
export class FileChatLogger implements ChatLogger {
  private readonly logsDir: string;

  constructor() {
    this.logsDir = path.resolve(process.cwd(), 'logs');
    fs.mkdirSync(this.logsDir, { recursive: true });
  }

  log(sessionId: string, entry: ChatLogEntry): void {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      sid: sessionId,
      dir: entry.dir,
      type: entry.type,
      data: entry.data,
    });
    const filePath = path.join(this.logsDir, `chat-${sessionId}.jsonl`);
    fs.appendFileSync(filePath, `${line}\n`);
  }

  close(_sessionId: string): void {
    // No-op: appendFileSync doesn't hold open handles
  }
}
