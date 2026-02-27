import type { ChatSession, ProcessFactory } from '@code-quest/summoner';
import { InteractiveSession } from '@code-quest/summoner';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types.ts';
import type { SessionStore } from './session-store.ts';

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
    @inject(TYPES.SessionStore) private sessionStore: SessionStore,
  ) {}

  create(resumeSessionId?: string): ChatSession {
    const command = 'claude';
    const args = ['--output-format', 'stream-json', '--input-format', 'stream-json', '--verbose'];

    const session = new InteractiveSession({
      processFactory: this.processFactory,
      command,
      args,
      resumeSessionId,
    });

    this.activeSessions.set(session.id, session);

    this.sessionStore
      .persist({
        id: session.id,
        provider: 'claude',
        command,
        args: JSON.stringify(args),
        cwd: process.cwd(),
        mode: 'interactive',
        role: 'chat',
        parentId: resumeSessionId,
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
