import type { SessionData, SessionSource } from '@code-quest/jsonl-codec';
import type { RawEventService } from './raw-event-service.ts';
import type { SessionStore } from './session-store.ts';

export class DbReader implements SessionSource {
  private readonly rawEventService: RawEventService;
  private readonly sessionStore: SessionStore;
  constructor(rawEventService: RawEventService, sessionStore: SessionStore) {
    this.rawEventService = rawEventService;
    this.sessionStore = sessionStore;
  }

  async read(sessionId: string): Promise<SessionData> {
    const [events, session] = await Promise.all([
      this.rawEventService.getBySession(sessionId),
      this.sessionStore.getById(sessionId),
    ]);

    const record = session
      ? { ...session, cwd: session.cwd ?? '', projectRoot: session.projectRoot ?? '' }
      : {
          id: sessionId,
          channelId: sessionId,
          provider: 'claude',
          command: 'claude',
          args: '[]',
          cwd: '',
          projectRoot: '',
          mode: 'interactive',
          role: 'chat',
          createdAt: new Date().toISOString(),
        };

    return { events, record };
  }
}
