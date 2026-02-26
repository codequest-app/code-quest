import type { ChatSession, ProcessFactory } from '@code-quest/summoner';
import { InteractiveSession } from '@code-quest/summoner';
import { inject, injectable } from 'inversify';
import { sessions } from '../db/schema-sqlite.ts';
import type { DrizzleDatabase } from '../db/sqlite-client.ts';
import { TYPES } from '../types.ts';

export interface SessionManager {
  create(resumeSessionId?: string): ChatSession;
  get(sessionId: string): ChatSession | undefined;
  kill(sessionId: string): void;
  getAll(): ChatSession[];
}

@injectable()
export class DefaultSessionManager implements SessionManager {
  private activeSessions = new Map<string, ChatSession>();

  constructor(
    @inject(TYPES.ProcessFactory) private processFactory: ProcessFactory,
    @inject(TYPES.Database) private db: DrizzleDatabase,
  ) {}

  create(resumeSessionId?: string): ChatSession {
    const session = new InteractiveSession({
      processFactory: this.processFactory,
      resumeSessionId,
    });

    this.activeSessions.set(session.id, session);

    this.db
      .insert(sessions)
      .values({
        id: session.id,
        provider: 'claude',
        command: 'claude',
        args: '[]',
        createdAt: new Date().toISOString(),
      })
      .catch((err) => {
        console.error('Failed to persist session:', err);
      });

    session.on('exit', () => {
      this.activeSessions.delete(session.id);
    });

    return session;
  }

  get(sessionId: string): ChatSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  kill(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.kill();
      this.activeSessions.delete(sessionId);
    }
  }

  getAll(): ChatSession[] {
    return Array.from(this.activeSessions.values());
  }
}
