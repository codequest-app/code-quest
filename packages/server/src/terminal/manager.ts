import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types.symbols.ts';
import type {
  TerminalManager,
  TerminalSession,
  TerminalSessionFactory,
  TerminalSessionOptions,
} from './types.ts';

/**
 * Terminal manager implementation
 * Manages multiple terminal sessions
 */
@injectable()
export class TerminalManagerImpl implements TerminalManager {
  private readonly sessions: Map<string, TerminalSession> = new Map();

  constructor(
    @inject(TYPES.TerminalSessionFactory)
    private readonly createSession_: TerminalSessionFactory,
  ) {}

  createSession(options?: TerminalSessionOptions): TerminalSession {
    const session = this.createSession_(options);
    this.sessions.set(session.id, session);

    // Auto-cleanup when session exits
    session.onExit(() => {
      this.sessions.delete(session.id);
    });

    return session;
  }

  getSession(id: string): TerminalSession | undefined {
    return this.sessions.get(id);
  }

  removeSession(id: string): boolean {
    const session = this.sessions.get(id);

    if (!session) {
      return false;
    }

    // Kill the session if it's still alive
    if (session.isAlive) {
      session.kill();
    }

    // Remove from map
    this.sessions.delete(id);

    return true;
  }

  listSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  cleanup(): void {
    // Kill all sessions
    this.sessions.forEach((session) => {
      if (session.isAlive) {
        session.kill();
      }
    });

    // Clear the map
    this.sessions.clear();
  }
}
