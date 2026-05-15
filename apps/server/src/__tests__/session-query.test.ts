import type { GetSessionResponse, SessionListResponse } from '@code-quest/shared';
import { segments as s } from '@code-quest/summoner/test';

type SessionListOk = Extract<SessionListResponse, { ok: true }>;
type GetSessionOk = Extract<GetSessionResponse, { ok: true }>;

import type { SessionStore } from '../services/session-store.ts';
import {
  createFakeServer,
  createFakeSummoner,
  createTestContainer,
  setupSession,
} from '../test/index.ts';
import { TYPES } from '../types.ts';

describe('ChatHandler > session', () => {
  describe('session:list', () => {
    it('returns sessions and total', async () => {
      const { claude } = await setupSession();

      const result = await (claude.send<SessionListResponse>(
        'session:list',
        {},
      ) as Promise<SessionListOk>);

      expect(result.ok).toBe(true);
      expect(result.data.total).toBeGreaterThanOrEqual(1);
      expect(result.data.sessions.length).toBeGreaterThanOrEqual(1);
    });

    it('uses first user message as title when session has no title', async () => {
      const { claude, channelId } = await setupSession();

      // Send a user message so raw_events has a 'user' entry
      await claude.send('chat:send', { channelId, message: 'Hello world' });
      await claude.emitSegment(s.assistant('hi'));
      await claude.emitSegment(s.result());

      const result = await (claude.send<SessionListResponse>(
        'session:list',
        {},
      ) as Promise<SessionListOk>);
      expect(result.ok).toBe(true);
      const session = result.data.sessions.find((s) => s.channelId === channelId);

      expect(session).toBeDefined();
      // Session has no explicit title, so firstUserMessage should be used
      expect(session!.firstUserMessage).toBe('Hello world');
    });

    it('session:init during processing does not wipe pendingTitlePrompt', async () => {
      const { container, claude, channelId } = await setupSession();

      claude.setControlRequestHandler((req) => {
        if (req.subtype === 'generate_session_title') {
          return { title: 'Generated Title' };
        }
        return null;
      });

      await claude.send('chat:send', { channelId, message: 'hello world' });
      // CLI sends session:init mid-processing (e.g. system event with config update)
      await claude.emitSegment(s.init('cli-sess', { model: 'claude-sonnet-4-6' }));
      await claude.emitSegment(s.assistant('hi'));
      await claude.emitSegment(s.result());

      // Title generation is async post-result; poll until it lands.
      await vi.waitFor(async () => {
        const result = await (claude.send<SessionListResponse>(
          'session:list',
          {},
        ) as Promise<SessionListOk>);
        expect(result.ok).toBe(true);
        const session = result.data.sessions.find((sess) => sess.channelId === channelId);
        expect(session?.title).toBe('Generated Title');
      });

      // DB persistence should have landed by the time API returns it.
      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      const record = await sessionStore.getByChannelId(channelId);
      expect(record).toBeDefined();
      expect(record!.title).toBe('Generated Title');
    });

    it('filters sessions by cwd when provided', async () => {
      const { claude } = await setupSession();

      const allResult = await (claude.send<SessionListResponse>(
        'session:list',
        {},
      ) as Promise<SessionListOk>);
      expect(allResult.ok).toBe(true);
      expect(allResult.data.total).toBeGreaterThanOrEqual(1);

      const cwdResult = (await claude.send<SessionListResponse>('session:list', {
        cwd: process.cwd(),
      })) as SessionListOk;
      expect(cwdResult.ok).toBe(true);
      expect(cwdResult.data.sessions.every((s) => s.cwd === process.cwd())).toBe(true);

      const noMatchResult = (await claude.send<SessionListResponse>('session:list', {
        cwd: '/nonexistent/path',
      })) as SessionListOk;
      expect(noMatchResult.ok).toBe(true);
      expect(noMatchResult.data.sessions).toHaveLength(0);
      expect(noMatchResult.data.total).toBe(0);
    });

    it('excludeLive omits sessions whose sessionId has an alive channel', async () => {
      const { container, claude } = await setupSession('alive-sess');
      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      // Persist a second session NOT backed by an alive channel
      await sessionStore.upsert({
        id: 'historical-sess',
        channelId: 'ch-historical',
        provider: 'claude',
        command: 'claude',
        args: '[]',
        projectRoot: '/test/project',
        mode: 'interactive',
        role: 'chat',
        createdAt: new Date().toISOString(),
      });

      const result = await (claude.send<SessionListResponse>('session:list', {
        excludeLive: true,
      }) as Promise<SessionListOk>);

      expect(result.ok).toBe(true);
      const ids = result.data.sessions.map((s) => s.id);
      expect(ids).toContain('historical-sess');
      expect(ids).not.toContain('alive-sess');
      expect(result.data.total).toBe(1);
    });

    it('excludeLive: false returns alive sessions too', async () => {
      const { container, claude } = await setupSession('alive-sess-2');
      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      await sessionStore.upsert({
        id: 'historical-sess-2',
        channelId: 'ch-h2',
        provider: 'claude',
        command: 'claude',
        args: '[]',
        projectRoot: '/test/project',
        mode: 'interactive',
        role: 'chat',
        createdAt: new Date().toISOString(),
      });

      const result = (await claude.send<SessionListResponse>('session:list', {
        excludeLive: false,
      })) as SessionListOk;

      expect(result.ok).toBe(true);
      const ids = result.data.sessions.map((s) => s.id);
      expect(ids).toContain('alive-sess-2');
      expect(ids).toContain('historical-sess-2');
    });

    it('excludeLive: true with no alive sessionIds returns all rows', async () => {
      // No setup() -> no alive channel with a sessionId
      const container = createTestContainer();
      const server = createFakeServer(container);
      const summoner = createFakeSummoner(server);
      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      await sessionStore.upsert({
        id: 'only-historical',
        channelId: 'ch-only',
        provider: 'claude',
        command: 'claude',
        args: '[]',
        projectRoot: '/test/project',
        mode: 'interactive',
        role: 'chat',
        createdAt: new Date().toISOString(),
      });

      // Spawn an unrelated socket to send session:list
      const claude = summoner.claude();
      // Don't initialize — no alive channel for any sessionId
      const result = await (claude.send<SessionListResponse>('session:list', {
        excludeLive: true,
      }) as Promise<SessionListOk>);

      expect(result.ok).toBe(true);
      expect(result.data.sessions.map((s) => s.id)).toContain('only-historical');
    });

    it('session:list with hasParentId only returns sessions with parentId', async () => {
      const { claude } = await setupSession();

      // Default session has no parentId
      const allResult = await (claude.send<SessionListResponse>(
        'session:list',
        {},
      ) as Promise<SessionListOk>);
      expect(allResult.ok).toBe(true);
      expect(allResult.data.total).toBeGreaterThanOrEqual(1);

      const remoteResult = (await claude.send<SessionListResponse>('session:list', {
        hasParentId: true,
      })) as SessionListOk;
      expect(remoteResult.ok).toBe(true);
      expect(
        remoteResult.data.sessions.every((s) => s.parentId !== undefined && s.parentId !== null),
      ).toBe(true);
    });
  });

  describe('session:get', () => {
    it('returns session metadata and events when found', async () => {
      const { claude, channelId } = await setupSession();

      await claude.send('chat:send', { channelId, message: 'hello' });
      await claude.emitSegment(s.assistant('hi'));
      await claude.emitSegment(s.result());

      const result = (await claude.send<GetSessionResponse>('session:get', {
        channelId,
      })) as GetSessionOk;

      expect(result.ok).toBe(true);
      expect(result.data.session).toBeDefined();
      expect(result.data.session.channelId).toBe(channelId);
      expect(result.data.events).toBeDefined();
      expect(result.data.events.length).toBeGreaterThan(0);
      const names = result.data.events.map((e) => e.name);
      expect(names).toContain('message:assistant');
    });

    it('returns error when not found', async () => {
      const { claude } = await setupSession();

      const result = await claude.send<GetSessionResponse>('session:get', {
        channelId: 'nonexistent',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe('Session not found');
    });

    it('returns events excluding streaming and control types', async () => {
      const { claude, channelId } = await setupSession();

      await claude.send('chat:send', { channelId, message: 'hi' });

      await claude.emitSegment(s.assistant('Hello!'));
      claude.emitSegment(
        s.assistant({ toolUse: { id: 'toolu_1', name: 'bash', input: { command: 'ls' } } }),
      );
      await claude.emitSegment(
        s.controlRequest('req-1', 'can_use_tool', 'bash', { command: 'ls' }),
      );

      await claude.send('chat:respond', {
        channelId,
        requestId: 'req-1',
        response: { behavior: 'allow' },
      });

      await claude.emitSegment(s.assistant('done'));
      await claude.emitSegment(s.result());

      const result = (await claude.send<GetSessionResponse>('session:get', {
        channelId,
      })) as GetSessionOk;

      expect(result.ok).toBe(true);
      expect(result.data.session).toBeDefined();
      expect(result.data.events).toBeDefined();
      expect(result.data.events.length).toBeGreaterThan(0);
      const names = result.data.events.map((e) => e.name);
      expect(names).toContain('message:assistant');
      expect(names.some((n: string) => n.startsWith('stream:'))).toBe(false);
      expect(names).not.toContain('control:permission');
      expect(names.some((n: string) => n.startsWith('control:'))).toBe(false);
    });
  });
});
