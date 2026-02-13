import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types.symbols.ts';
import type {
  ChatCommandsConfig,
  ChatManager,
  ChatProvider,
  ChatSession,
  ChatSessionFactory,
} from './types.ts';

@injectable()
export class ChatManagerImpl implements ChatManager {
  private sessions = new Map<string, ChatSession>();

  constructor(
    @inject(TYPES.ChatSessionFactory)
    private readonly createSession_: ChatSessionFactory,
    @inject(TYPES.ChatCommandsConfig)
    private readonly commands: ChatCommandsConfig,
  ) {}

  createSession(options: { provider: ChatProvider; cwd?: string }): ChatSession {
    const defaults = this.commands[options.provider];
    const session = this.createSession_({
      provider: options.provider,
      command: defaults.command,
      baseArgs: [...defaults.baseArgs],
      cwd: options.cwd,
    });

    this.sessions.set(session.id, session);
    return session;
  }

  getSession(id: string): ChatSession | undefined {
    return this.sessions.get(id);
  }

  removeSession(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.kill();
      this.sessions.delete(id);
    }
  }

  listSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  cleanup(): void {
    for (const session of this.sessions.values()) {
      session.kill();
    }
    this.sessions.clear();
  }
}
