import type { ChatLogEntry, ChatLogger, SessionMetadata } from '../chat/logger.ts';
import type { ChatLogRepository } from './repository.ts';

export class DrizzleChatLogger implements ChatLogger {
  constructor(private readonly repository: ChatLogRepository) {}

  createSession(sessionId: string, metadata: SessionMetadata): void {
    this.repository.insertSession({
      id: sessionId,
      provider: metadata.provider,
      command: metadata.command,
      args: JSON.stringify(metadata.args),
      cwd: metadata.cwd ?? null,
      mode: metadata.mode,
      createdAt: new Date().toISOString(),
    });
  }

  log(sessionId: string, entry: ChatLogEntry): void {
    this.repository.insertEvent({
      sessionId,
      dir: entry.dir,
      type: entry.type,
      data: JSON.stringify(entry.data),
      createdAt: new Date().toISOString(),
    });
  }

  close(_sessionId: string): void {
    // No-op
  }
}
