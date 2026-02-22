import type { ChatLogEntry, ChatLogger, SessionMetadata } from '../chat/logger.ts';
import type { AppDatabase } from './connection.ts';
import { events, sessions } from './schema.ts';

export class DrizzleChatLogger implements ChatLogger {
  constructor(private readonly db: AppDatabase) {}

  createSession(sessionId: string, metadata: SessionMetadata): void {
    this.db
      .insert(sessions)
      .values({
        id: sessionId,
        provider: metadata.provider,
        command: metadata.command,
        args: JSON.stringify(metadata.args),
        cwd: metadata.cwd ?? null,
        mode: metadata.mode,
        createdAt: new Date().toISOString(),
      })
      .run();
  }

  log(sessionId: string, entry: ChatLogEntry): void {
    this.db
      .insert(events)
      .values({
        sessionId,
        dir: entry.dir,
        type: entry.type,
        data: JSON.stringify(entry.data),
        createdAt: new Date().toISOString(),
      })
      .run();
  }

  close(_sessionId: string): void {
    // No-op: SQLite handles cleanup
  }
}
