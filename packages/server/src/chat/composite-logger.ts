import type { ChatLogEntry, ChatLogger, SessionMetadata } from './logger.ts';

export class CompositeChatLogger implements ChatLogger {
  constructor(private readonly loggers: ChatLogger[]) {}

  createSession(sessionId: string, metadata: SessionMetadata): void {
    for (const logger of this.loggers) {
      logger.createSession(sessionId, metadata);
    }
  }

  log(sessionId: string, entry: ChatLogEntry): void {
    for (const logger of this.loggers) {
      logger.log(sessionId, entry);
    }
  }

  close(sessionId: string): void {
    for (const logger of this.loggers) {
      logger.close(sessionId);
    }
  }
}
