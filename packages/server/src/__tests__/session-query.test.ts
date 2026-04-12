import type { ClientMessage } from '@code-quest/shared';
import { segments as s } from '@code-quest/summoner/test';
import type { SessionStore } from '../services/session-store.ts';
import { createFakeServer, createFakeSummoner, createTestContainer } from '../test/index.ts';
import { TYPES } from '../types.ts';

async function setup(sessionId = 'cli-sess') {
  const container = createTestContainer();
  const server = createFakeServer(container);
  const summoner = createFakeSummoner(server);
  const claude = summoner.claude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { container, claude, channelId };
}

describe('ChatHandler > session', () => {
  describe('session:list', () => {
    it('returns sessions and total', async () => {
      const { claude } = await setup();

      const result = await claude.send<{ sessions: Record<string, unknown>[]; total: number }>(
        'session:list',
        {},
      );

      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.sessions.length).toBeGreaterThanOrEqual(1);
    });

    it('uses first user message as title when session has no title', async () => {
      const { claude, channelId } = await setup();

      // Send a user message so raw_entries has a 'user' entry
      await claude.send('chat:send', { channelId, message: 'Hello world' });
      await claude.emit(s.assistant('hi'));
      await claude.emit(s.result());

      const result = await claude.send<{ sessions: Record<string, unknown>[]; total: number }>(
        'session:list',
        {},
      );
      const session = result.sessions.find((s) => s.channelId === channelId);

      expect(session).toBeDefined();
      // Session has no explicit title, so firstUserMessage should be used
      expect(session!.firstUserMessage).toBe('Hello world');
    });

    it('session:init during processing does not wipe pendingTitlePrompt', async () => {
      const { container, claude, channelId } = await setup();

      claude.onControlRequest((req) => {
        if (req.subtype === 'generate_session_title') {
          return { title: 'Generated Title' };
        }
        return null;
      });

      await claude.send('chat:send', { channelId, message: 'hello world' });
      // CLI sends session:init mid-processing (e.g. system event with config update)
      await claude.emit(s.init('cli-sess', { model: 'claude-sonnet-4-6' }));
      await claude.emit(s.assistant('hi'));
      await claude.emit(s.result());
      await new Promise<void>((r) => setTimeout(r, 100));

      // Verify client-facing API returns title
      const result = await claude.send<{ sessions: Record<string, unknown>[]; total: number }>(
        'session:list',
        {},
      );
      const session = result.sessions.find((sess) => sess.channelId === channelId);
      expect(session?.title).toBe('Generated Title');

      // Verify DB persistence
      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      const record = await sessionStore.getById(channelId);
      expect(record).toBeDefined();
      expect(record!.title).toBe('Generated Title');
    });

    it('filters sessions by cwd when provided', async () => {
      const { claude } = await setup();

      const allResult = await claude.send<{ sessions: Record<string, unknown>[]; total: number }>(
        'session:list',
        {},
      );
      expect(allResult.total).toBeGreaterThanOrEqual(1);

      const cwdResult = await claude.send<{ sessions: Record<string, unknown>[]; total: number }>(
        'session:list',
        {
          cwd: process.cwd(),
        },
      );
      expect(cwdResult.sessions.every((s) => s.cwd === process.cwd())).toBe(true);

      const noMatchResult = await claude.send<{
        sessions: Record<string, unknown>[];
        total: number;
      }>('session:list', {
        cwd: '/nonexistent/path',
      });
      expect(noMatchResult.sessions).toHaveLength(0);
      expect(noMatchResult.total).toBe(0);
    });

    it('session:list with hasParentId only returns sessions with parentId', async () => {
      const { claude } = await setup();

      // Default session has no parentId
      const allResult = await claude.send<{
        sessions: Record<string, unknown>[];
        total: number;
      }>('session:list', {});
      expect(allResult.total).toBeGreaterThanOrEqual(1);

      const remoteResult = await claude.send<{
        sessions: Record<string, unknown>[];
        total: number;
      }>('session:list', { hasParentId: true });
      expect(
        remoteResult.sessions.every((s) => s.parentId !== undefined && s.parentId !== null),
      ).toBe(true);
    });
  });

  describe('session:get', () => {
    it('returns session metadata and events when found', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'hello' });
      await claude.emit(s.assistant('hi'));
      await claude.emit(s.result());

      const result = await claude.send<{
        session?: Record<string, unknown>;
        events?: ClientMessage[];
        error?: string;
      }>('session:get', { channelId });

      expect(result.session).toBeDefined();
      expect(result.session!.channelId).toBe(channelId);
      expect(result.events).toBeDefined();
      expect(result.events!.length).toBeGreaterThan(0);
      const names = result.events!.map((e) => e.name);
      expect(names).toContain('message:assistant');
    });

    it('returns error when not found', async () => {
      const { claude } = await setup();

      const result = await claude.send<{ session?: unknown; error?: string }>('session:get', {
        channelId: 'nonexistent',
      });

      expect(result.error).toBe('Session not found');
    });

    it('returns events excluding streaming and control types', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'hi' });

      await claude.emit(s.assistant('Hello!'));
      claude.emit(
        s.assistant({ toolUse: { id: 'toolu_1', name: 'bash', input: { command: 'ls' } } }),
      );
      await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'bash', { command: 'ls' }));

      await claude.send('chat:respond', {
        channelId,
        requestId: 'req-1',
        response: { behavior: 'allow' },
      });

      await claude.emit(s.assistant('done'));
      await claude.emit(s.result());

      const result = await claude.send<{
        session?: Record<string, unknown>;
        events?: ClientMessage[];
        error?: string;
      }>('session:get', { channelId });

      expect(result.session).toBeDefined();
      expect(result.events).toBeDefined();
      expect(result.events!.length).toBeGreaterThan(0);
      const names = result.events!.map((e) => e.name);
      expect(names).toContain('message:assistant');
      expect(names.some((n: string) => n.startsWith('stream:'))).toBe(false);
      expect(names).not.toContain('control:permission');
      expect(names.some((n: string) => n.startsWith('control:'))).toBe(false);
    });
  });
});
