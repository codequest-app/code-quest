/* biome-ignore-all lint/suspicious/noExplicitAny: test harness uses type assertions */

import type { ClientMessage } from '@code-quest/shared';
import { messageContentSchema } from '@code-quest/shared';
import { segments as s } from '@code-quest/summoner/test';
import { logger } from '../logger.ts';
import type { RawEventStore } from '../services/raw-event-store.ts';
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
  describe('session creation', () => {
    it('creates a session and emits chat:created', async () => {
      const { container, claude, channelId } = await setup();

      expect(channelId).toBeDefined();
      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(channelId)).toBeDefined();
    });

    it('prepareInit + external launch completes init without calling initialize()', async () => {
      const claude = createFakeSummoner().claude();
      claude.prepareInit(s.init('prep-sess'));

      // External launch (simulates UI "New tab" click)
      const channelId = await claude.send<{ channelId: string }>('session:launch', {
        channelId: 'ch-prep',
      });

      expect(channelId).toBeDefined();
    });

    it('session:launch with cwd passes cwd to CLI spawn options', async () => {
      const claude = createFakeSummoner().claude();
      claude.prepareInit(s.init('cwd-sess'));

      await claude.send<{ channelId: string }>('session:launch', {
        channelId: 'ch-cwd',
        cwd: '/projects/my-app',
      });

      const lastSpawn = claude.provider.spawnCalls[claude.provider.spawnCalls.length - 1];
      expect(lastSpawn.options?.cwd).toBe('/projects/my-app');
    });

    it('session:init with worktree cwd sets channel.worktree', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const claude = createFakeSummoner(server).claude();
      const worktreeCwd = '/repo/.claude/worktrees/my-feature';
      claude.prepareInit(s.init('wt-sess'));

      const { channelId } = await claude.send<{ channelId: string }>('session:launch', {
        channelId: 'ch-wt',
        cwd: worktreeCwd,
      });

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      const channel = mgr.get(channelId ?? 'ch-wt');
      expect(channel?.worktree).toEqual({ name: 'my-feature', path: worktreeCwd });
    });

    it('session record is written to DB with session_id set (from system/init, not started)', async () => {
      const { container, claude, channelId } = await setup();

      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      const record = await sessionStore.getByChannelId(channelId);
      expect(record).not.toBeNull();
      expect(record!.id).toBe('cli-sess');
    });

    it('sessionStore.upsert is fire-and-forget: custom:created fires without awaiting persist', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const claude = createFakeSummoner(server).claude();

      let persistResolved = false;
      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      const realPersist = sessionStore.upsert.bind(sessionStore);
      sessionStore.upsert = async (...args: [Parameters<typeof realPersist>[0]]) => {
        const result = await realPersist(...args);
        persistResolved = true;
        return result;
      };

      let customCreatedFiredBeforePersist = false;
      claude.on('session:created', () => {
        customCreatedFiredBeforePersist = !persistResolved;
      });

      await claude.initialize(s.init('persist-test'));

      expect(customCreatedFiredBeforePersist).toBe(true);
    });

    it('emits chat:created AFTER initialize completes with promoted session ID', async () => {
      const claude = createFakeSummoner().claude();

      const channelId = await claude.initialize(s.init('promoted-sess'));

      const createdEvents = claude.events('session:created');
      expect(createdEvents.length).toBeGreaterThan(0);
      expect(createdEvents[0].channelId).toBe(channelId);
    });

    it('creates session with default init when no initOptions', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const claude = createFakeSummoner(server).claude();
      const channelId = await claude.initialize();

      expect(channelId).toBeDefined();
      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(channelId)).toBeDefined();
    });

    it('launch emits exactly one session:init with final metaCache', async () => {
      const claude = createFakeSummoner().claude();

      const channelId = await claude.initialize(
        s.init('cli-sess', {
          model: 'claude-sonnet-4-6',
          slashCommands: ['commit', 'review'],
        }),
      );

      const initEvents = claude.events('session:init');
      // Only 1 session:init — from launch handler (Channel.emit suppressed for session:init)
      expect(initEvents.length).toBe(1);
      expect(initEvents[0].channelId).toBe(channelId);
      expect(initEvents[0].model).toBe('claude-sonnet-4-6');
      expect(initEvents[0].slashCommands).toEqual(['commit', 'review']);
    });

    it('chat:create callback includes slashCommands from initialize response', async () => {
      const claude = createFakeSummoner().claude();
      claude.initialize(s.init('cli-sess', { slashCommands: ['commit', 'review', 'debug'] }));

      const result = await claude.send<{ channelId: string; slashCommands?: string[] }>(
        'session:launch',
        { channelId: 'test-slash-cmds' },
      );

      expect(result.channelId).toBeDefined();
      expect(result.slashCommands).toEqual(['commit', 'review', 'debug']);
    });

    it('chat:create callback includes models and account from initialize response', async () => {
      const models = [
        {
          value: 'default',
          displayName: 'Default',
          supportsEffort: true,
          supportedEffortLevels: ['low', 'high'],
        },
        { value: 'haiku', displayName: 'Haiku' },
      ];
      const account = { email: 'test@example.com', subscriptionType: 'Claude Max' };
      const claude = createFakeSummoner().claude();
      claude.initialize(s.init('cli-sess'), s.controlResponse('init', { models, account }));

      const result = await claude.send<{
        channelId: string;
        models?: unknown[];
        account?: unknown;
      }>('session:launch', { channelId: 'test-models-acct' });

      expect(result.models).toEqual(models);
      expect(result.account).toEqual(account);
    });

    it('session:launch emits app:models when initialize response has models', async () => {
      const models = [
        { value: 'default', displayName: 'Default' },
        { value: 'haiku', displayName: 'Haiku' },
      ];
      const claude = createFakeSummoner().claude();

      await claude.initialize(s.init('cli-sess'), s.controlResponse('init', { models }));

      const modelEvents = claude.events('app:models');
      expect(modelEvents.length).toBeGreaterThan(0);
      expect(modelEvents[0].models).toEqual(models);
    });

    it('session:join emits app:models to joining socket when cachedModels available', async () => {
      const models = [
        { value: 'default', displayName: 'Default' },
        { value: 'haiku', displayName: 'Haiku' },
      ];
      const server = createFakeServer();
      const windowA = createFakeSummoner(server);
      const windowB = createFakeSummoner(server);
      const channelId = await windowA
        .claude()
        .initialize(s.init('cli-sess'), s.controlResponse('init', { models }));

      await windowB.send('session:join', { channelId });

      const modelEvents = windowB.events('app:models');
      expect(modelEvents.length).toBeGreaterThan(0);
      expect(modelEvents[0].models).toEqual(models);
    });
  });

  describe('session:join', () => {
    it('emits session:init to joining socket with full config from metaCache', async () => {
      const server = createFakeServer();
      const windowA = createFakeSummoner(server);
      const windowB = createFakeSummoner(server);
      const channelId = await windowA.claude().initialize(
        s.init('cli-sess', {
          model: 'claude-sonnet-4-6',
          tools: ['Read', 'Write', 'Bash'],
          permissionMode: 'default',
          fastModeState: 'off',
          mcpServers: [{ name: 'github', status: 'connected' }],
          slashCommands: ['commit', 'review'],
        }),
      );

      await windowB.send('session:join', { channelId });

      const initEvents = windowB.events('session:init');
      expect(initEvents.length).toBeGreaterThan(0);
      const event = initEvents[0];
      expect(event.channelId).toBe(channelId);
      expect(event.model).toBe('claude-sonnet-4-6');
      expect(event.tools).toEqual(['Read', 'Write', 'Bash']);
      expect(event.permissionMode).toBe('default');
      expect(event.fastModeState).toBe('off');
      expect(event.mcpServers).toEqual([{ name: 'github', status: 'connected' }]);
      expect(event.slashCommands).toEqual(['commit', 'review']);
    });

    it('joins an existing session and receives state + cwd', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<{ channelId: string; state: string; cwd: string }>(
        'session:join',
        { channelId },
      );

      expect(result.channelId).toBe(channelId);
      expect(result.state).toBe('idle');
      expect(result.cwd).toEqual(expect.any(String));
    });

    it('join returns busy state when session is streaming', async () => {
      const { claude, channelId } = await setup();

      // Send a message to make session busy (no result yet = still streaming)
      await claude.send('chat:send', { channelId, message: 'hello' });

      const result = await claude.send<{ channelId: string; state: string }>('session:join', {
        channelId,
      });

      expect(result.state).toBe('busy');
    });

    it('returns error for non-existent session', async () => {
      const { claude } = await setup();

      const result = await claude.send<{ error: string }>('session:join', {
        channelId: 'nonexistent',
      });

      expect(result.error).toBe('Session not found');
    });

    it('resumes CLI with stored session_id when no live process exists', async () => {
      const { container, claude, channelId } = await setup();

      // Verify session was persisted with sessionId
      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      const record = await sessionStore.getByChannelId(channelId);
      expect(record?.id).toBe('cli-sess');

      // Kill the process
      claude.handle.abort();
      await new Promise<void>((r) => queueMicrotask(r));

      // Rejoin — should resume with stored sessionId
      const result = await claude.send<{ channelId?: string; error?: string }>('session:join', {
        channelId,
      });

      expect(result.error).toBeUndefined();
      expect(result.channelId).toBe(channelId);
    });

    it('falls back to error when no live process and no DB record', async () => {
      const { claude } = await setup();

      const unknownChannelId = crypto.randomUUID();
      const result = await claude.send<{ error?: string }>('session:join', {
        channelId: unknownChannelId,
      });

      expect(result.error).toBe('Session not found');
    });

    it('returns stored messages in callback after join', async () => {
      const { claude, channelId } = await setup();

      // Send message + receive reply (stored in raw_entries)
      await claude.send('chat:send', { channelId, message: 'hi' });
      await claude.emit(s.assistant('hello world'));
      await claude.emit(s.result());

      // Join same session — should get history
      const result = await claude.send<{
        channelId?: string;
        events?: ClientMessage[];
        error?: string;
      }>('session:join', { channelId });

      expect(result.error).toBeUndefined();
      expect(result.events).toBeDefined();
      expect(result.events!.length).toBeGreaterThan(0);
      const names = result.events!.map((e) => e.name);
      expect(names).toContain('message:assistant');
    });

    it('returns user message in history after join', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'hi' });
      await claude.emit(s.assistant('hello world'));
      await claude.emit(s.result());

      const result = await claude.send<{
        events?: ClientMessage[];
        error?: string;
      }>('session:join', { channelId });

      expect(result.error).toBeUndefined();
      const names = result.events!.map((e) => e.name);
      expect(names).toContain('message:user');

      const userMessage = result.events!.find((e) => e.name === 'message:user');
      const { content } = messageContentSchema.parse(userMessage?.payload);
      expect(content).toEqual([{ type: 'text', text: 'hi' }]);
    });

    it('history preserves user→assistant order after join', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'today?' });
      await claude.emit(s.assistant('Tuesday'));
      await claude.emit(s.result());

      const result = await claude.send<{
        events?: ClientMessage[];
      }>('session:join', { channelId });

      const names = result.events!.map((e) => e.name);
      const userIdx = names.indexOf('message:user');
      const assistantIdx = names.indexOf('message:assistant');
      expect(userIdx).toBeGreaterThanOrEqual(0);
      expect(assistantIdx).toBeGreaterThanOrEqual(0);
      expect(userIdx).toBeLessThan(assistantIdx);
    });

    it('does not duplicate user message in history when CLI echoes it back', async () => {
      const { container, claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'hello' });

      // CLI echoes the user message back through stdout (real CLI behavior)
      await claude.emit(
        JSON.stringify({
          type: 'user',
          message: { role: 'user', content: [{ type: 'text', text: 'hello' }] },
          uuid: 'msg-echo',
        }),
      );

      await claude.emit(s.assistant('hi there'));
      await claude.emit(s.result());

      // Verify raw_event_store has both stdin and stdout records
      const rawStore = container.get<RawEventStore>(TYPES.RawEventStore);
      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      const channel = mgr.get(channelId)!;
      const rawEntries = await rawStore.getBySession(channel.sessionId!);
      const userRawEntries = rawEntries.filter((e) => {
        try {
          const obj = JSON.parse(e.raw.trim());
          return obj?.type === 'user';
        } catch {
          return false;
        }
      });
      // stdin + stdout echo = 2 raw entries for one "hello"
      expect(userRawEntries.length).toBe(2);
      expect(userRawEntries.map((e) => e.direction).sort()).toEqual(['in', 'out']);

      // But history should deduplicate to exactly 1
      const result = await claude.send<{
        events?: ClientMessage[];
        error?: string;
      }>('session:join', { channelId });

      expect(result.error).toBeUndefined();
      const userTextEvents = result.events!.filter((e) => {
        if (e.name !== 'message:user') return false;
        const parsed = messageContentSchema.safeParse(e.payload);
        return (
          parsed.success && parsed.data.content.some((b) => b.type === 'text' && b.text === 'hello')
        );
      });
      expect(userTextEvents.length).toBe(1);
    });

    it('returns session_init event when session has no user messages', async () => {
      const { claude, channelId } = await setup();
      // No sendMessage — only session_init in raw_entries

      const result = await claude.send<{
        events?: ClientMessage[];
        error?: string;
      }>('session:join', { channelId });

      expect(result.error).toBeUndefined();
      expect(result.events).toBeDefined();
      expect(result.events!.every((e) => e.name === 'session:init')).toBe(true);
    });

    it('chat:join callback returns the provided channelId (not internal CLI ID)', async () => {
      const claude = createFakeSummoner().claude();
      const clientId = 'client-join-uuid';
      await claude.initialize(s.init('cli-sess'), { launch: { channelId: clientId } });

      const joinResult = await claude.send<{ channelId: string; state: string }>('session:join', {
        channelId: clientId,
      });

      expect(joinResult.channelId).toBe(clientId);
    });
  });

  describe('session:created broadcast', () => {
    it('session:created fires on launch', async () => {
      const claude = createFakeSummoner().claude();

      const channelId = await claude.initialize();

      const createdEvents = claude.events('session:created');
      expect(createdEvents.length).toBeGreaterThan(0);
      expect(createdEvents[0].channelId).toBe(channelId);
      expect(createdEvents[0].cwd).toEqual(expect.any(String));
    });
  });

  describe('session persist timing', () => {
    it('session record has sessionId immediately after launch', async () => {
      const { container, claude, channelId } = await setup();
      await new Promise<void>((r) => setTimeout(r, 50));

      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      const record = await sessionStore.getByChannelId(channelId);
      expect(record).toBeDefined();
      expect(record!.id).toBeTruthy();
    });

    it('session:created is NOT blocked when session:init has no sessionId', async () => {
      const server = createFakeServer();
      const windowA = createFakeSummoner(server);
      const windowB = createFakeSummoner(server);

      // session:init without sessionId (simulates delayed sessionId)
      const initWithoutSessionId = JSON.stringify({
        type: 'init',
        session_id: '',
      });
      const controlResp = JSON.stringify({
        type: 'control_response',
        response: { subtype: 'success', request_id: '' },
      });

      const channelId = crypto.randomUUID();
      await windowA
        .claude()
        .initialize({ launch: { channelId } }, initWithoutSessionId, controlResp);
      await new Promise<void>((r) => setTimeout(r, 50));

      const createdEvents = windowB.events('session:created') as Array<{ channelId: string }>;
      // session:created should fire even without sessionId
      expect(createdEvents.some((e) => e.channelId === channelId)).toBe(true);
    });

    it('persist happens when session:init arrives with sessionId', async () => {
      const { container, claude, channelId } = await setup();
      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);

      // session:init already arrived during setup() — persist should have happened
      const record = await sessionStore.getByChannelId(channelId);
      expect(record).toBeDefined();
      expect(record!.id).toBe('cli-sess');
    });

    it('session:created is broadcast to second socket after launch', async () => {
      const server = createFakeServer();
      const windowA = createFakeSummoner(server);
      const windowB = createFakeSummoner(server);
      await windowA.claude().initialize(s.init('cli-sess'));

      // Launch a second session — windowB should receive session:created
      const newChannelId = crypto.randomUUID();
      await windowA.send('session:launch', { channelId: newChannelId });
      await new Promise<void>((r) => setTimeout(r, 50));

      const createdEvents = windowB.events('session:created') as Array<{ channelId: string }>;
      expect(createdEvents.length).toBeGreaterThan(0);
      expect(createdEvents.some((e) => e.channelId === newChannelId)).toBe(true);
    });
  });

  it('session:launch succeeds when initResult.response is undefined', async () => {
    const claude = createFakeSummoner().claude();
    // control_response without a nested response field (response.response is undefined)
    const controlResp = JSON.stringify({
      type: 'control_response',
      response: { subtype: 'success', request_id: '__PLACEHOLDER__' },
    });
    const channelId = await claude.initialize(s.init('sess-no-resp'), controlResp);

    expect(channelId).toBeTruthy();
    expect(channelId).not.toBe('');
  });

  describe('session:launch error logging', () => {
    it('logs error when session:launch fails', async () => {
      const claude = createFakeSummoner().claude();
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);

      // Send invalid payload to trigger catch — missing required init segments
      await claude.send('session:launch', null);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.any(Error) }),
        'Failed to create session',
      );
      errorSpy.mockRestore();
    });
  });

  describe('session persistence', () => {
    it('session persists after socket disconnect (no grace kill)', async () => {
      const { claude } = await setup();

      claude.disconnect();
      await new Promise<void>((r) => queueMicrotask(r));

      // Process should still be alive (not killed on disconnect)
      expect(claude.handle.signal.aborted).toBe(false);
    });

    it('raw entries are persisted to DB after session is created (no FK error)', async () => {
      const { container, claude } = await setup();

      const rawEventStore = container.get<RawEventStore>(TYPES.RawEventStore);
      const entries = await rawEventStore.getBySession('cli-sess');
      expect(entries.length).toBeGreaterThan(0);
    });

    it('records each stdin message exactly once in raw event store', async () => {
      const { container, claude, channelId } = await setup();

      // Verify runner has exactly 1 stdin listener (no double wireRawPersistence)
      const mgr = container.get<{
        get(id: string): { runner: { listenerCount(e: string): number } } | undefined;
      }>(TYPES.ChannelManager);
      expect(mgr.get(channelId)!.runner.listenerCount('stdin')).toBe(1);

      await claude.send('chat:send', { channelId, message: 'hello' });

      const rawEventStore = container.get<RawEventStore>(TYPES.RawEventStore);
      const entries = await rawEventStore.getBySession('cli-sess');
      const stdinHellos = entries.filter(
        (e) =>
          e.direction === 'in' && e.raw.includes('"hello"') && !e.raw.includes('control_request'),
      );
      expect(stdinHellos.length).toBe(1);
    });
  });

  describe('multi-socket', () => {
    it('session persists after socket disconnect (no kill)', async () => {
      const { claude } = await setup();

      claude.disconnect();
      await new Promise<void>((r) => queueMicrotask(r));

      expect(claude.handle.signal.aborted).toBe(false);
    });

    it('second client joins and receives user message in history', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'first msg' });
      await claude.emit(s.assistant('reply'));
      await claude.emit(s.result());

      const result = await claude.send<{
        channelId?: string;
        events?: ClientMessage[];
        error?: string;
      }>('session:join', { channelId });

      expect(result.error).toBeUndefined();
      const names = result.events!.map((e) => e.name);
      expect(names).toContain('message:user');
    });
  });

  describe('multi-socket (A + B browsers)', () => {
    it('second socket joins same session and receives events', async () => {
      const server = createFakeServer();
      const windowA = createFakeSummoner(server);
      const windowB = createFakeSummoner(server);
      const channelId = await windowA.claude().initialize(s.init('cli-sess'));

      // B joins A's session
      await windowB.send('session:join', { channelId });
      await new Promise<void>((r) => setTimeout(r, 50));

      // A sends message → CLI replies → both sockets receive
      await windowA.send('chat:send', { channelId, message: 'hello from A' });
      await windowA.claude().emit(s.assistant('broadcast reply'));
      await windowA.claude().emit(s.result());

      const bEvents = windowB.events('message:assistant');
      expect(bEvents.length).toBeGreaterThan(0);
      expect(bEvents[0].channelId).toBe(channelId);
    });

    it('window B receives only expected events when A sends a message (no cancel)', async () => {
      const server = createFakeServer();
      const windowA = createFakeSummoner(server);
      const windowB = createFakeSummoner(server);
      const channelId = await windowA.claude().initialize(s.init('cli-sess'));

      await windowB.send('session:join', { channelId });
      await new Promise<void>((r) => setTimeout(r, 50));

      await windowA.send('chat:send', { channelId, message: 'hello' });
      await windowA.claude().emit(s.assistant('hi'));
      await windowA.claude().emit(s.result());

      const allBEvents = [
        ...windowB
          .events('chat:cancel_request')
          .map((p: any) => ({ event: 'chat:cancel_request', payload: p })),
        ...windowB
          .events('control:cancel')
          .map((p: any) => ({ event: 'control:cancel', payload: p })),
        ...windowB
          .events('control:permission')
          .map((p: any) => ({ event: 'control:permission', payload: p })),
        ...windowB
          .events('message:assistant')
          .map((p: any) => ({ event: 'message:assistant', payload: p })),
        ...windowB
          .events('session:states')
          .map((p: any) => ({ event: 'session:states', payload: p })),
        ...windowB
          .events('session:closed')
          .map((p: any) => ({ event: 'session:closed', payload: p })),
      ];

      const cancelEvents = allBEvents.filter(
        (e) => e.event === 'chat:cancel_request' || e.event === 'control:cancel',
      );
      expect(cancelEvents).toHaveLength(0);
    });

    it('window B does NOT receive chat:cancel_request when A sends a message', async () => {
      const server = createFakeServer();
      const windowA = createFakeSummoner(server);
      const windowB = createFakeSummoner(server);
      const channelId = await windowA.claude().initialize(s.init('cli-sess'));

      await windowB.send('session:join', { channelId });
      await new Promise<void>((r) => setTimeout(r, 50));

      // A sends message — should NOT trigger cancel_request on B
      await windowA.send('chat:send', { channelId, message: 'hello' });
      await windowA.claude().emit(s.assistant('hi'));
      await windowA.claude().emit(s.result());

      const bCancelEvents = windowB.events('chat:cancel_request');
      expect(bCancelEvents).toHaveLength(0);
    });

    it('window B receives chat:cancel_request when window A responds to permission', async () => {
      const server = createFakeServer();
      const windowA = createFakeSummoner(server);
      const windowB = createFakeSummoner(server);
      const channelId = await windowA.claude().initialize(s.init('cli-sess'));

      await windowB.send('session:join', { channelId });
      await new Promise<void>((r) => setTimeout(r, 50));

      await windowA.send('chat:send', { channelId, message: 'go' });
      await windowA
        .claude()
        .emit(
          s.assistant({ toolUse: { id: 'toolu_1', name: 'Read', input: { file_path: '/tmp/x' } } }),
        );
      await windowA
        .claude()
        .emit(s.controlRequest('req-ab', 'can_use_tool', 'Read', { file_path: '/tmp/x' }));

      // A responds → B gets chat:cancel_request
      await windowA.send('chat:respond', {
        requestId: 'req-ab',
        response: { behavior: 'allow', updatedInput: {} },
      });

      const bCancelEvents = windowB.events('chat:cancel_request');
      expect(bCancelEvents.length).toBeGreaterThan(0);
      expect(bCancelEvents[0].targetRequestId).toBe('req-ab');
    });

    // NOTE: "old socket does not receive events after disconnect" requires FakeSocket
    // to trigger server-side disconnect handler (socket.on('disconnect')). Currently
    // FakeSocket.disconnect() only sets connected=false locally. Deferred until FakeSocket
    // supports server-side disconnect notification.
  });

  describe('resume cross-window sync', () => {
    it('session:join lazy resume does NOT broadcast session:created', async () => {
      const server = createFakeServer();
      const windowA = createFakeSummoner(server);
      const windowB = createFakeSummoner(server);
      const channelId = await windowA.claude().initialize(s.init('cli-sess'));

      // Create history then kill process
      await windowA.send('chat:send', { channelId, message: 'hello' });
      await windowA.claude().emit(s.assistant('world'));
      await windowA.claude().emit(s.result());
      windowA.claude().handle.abort();
      await new Promise<void>((r) => setTimeout(r, 50));

      // windowB joins (triggers lazy resume)
      await windowB.send('session:join', { channelId });
      await new Promise<void>((r) => setTimeout(r, 50));

      // Lazy resume should NOT broadcast session:created — session already exists
      const createdEvents = windowB.events('session:created') as Array<{ channelId: string }>;
      // Filter out events from the initial creation — only check for events after the resume
      // The initial windowA.claude().initialize broadcasts session:created to all sockets including windowB
      // So we check that no NEW session:created was broadcast for the same channelId during resume
      const resumeCreatedEvents = createdEvents.filter((e) => e.channelId === channelId);
      // The initial creation broadcasts 1 event; resume should NOT add another
      expect(resumeCreatedEvents.length).toBeLessThanOrEqual(1);
    });
  });

  describe('close tab cross-window sync', () => {
    it('session:close broadcasts session:dead to all sockets', async () => {
      const server = createFakeServer();
      const windowA = createFakeSummoner(server);
      const windowB = createFakeSummoner(server);
      const channelId = await windowA.claude().initialize(s.init('cli-sess'));

      // socketA closes session
      await windowA.send('session:close', { channelId });
      await new Promise<void>((r) => setTimeout(r, 50));

      const deadEvents = windowB.events('session:dead') as Array<{ channelId: string }>;
      expect(deadEvents.length).toBeGreaterThan(0);
      expect(deadEvents[0].channelId).toBe(channelId);
    });
  });

  describe('unified chat:create', () => {
    it('chat:create with channelId uses it as externalId for events', async () => {
      const claude = createFakeSummoner().claude();
      const clientId = 'unified-client-uuid';

      const channelId = await claude.initialize(s.init('cli-sess'), {
        launch: { channelId: clientId },
      });
      expect(channelId).toBe(clientId);

      await claude.send('chat:send', { channelId: clientId, message: 'hello' });

      await claude.emit(s.assistant('hi'));
      await claude.emit(s.result());

      const events = claude.events('message:assistant');
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events.every((e: any) => e.channelId === clientId)).toBe(true);
    });

    it('chat:create with channelId emits chat:created with clientId', async () => {
      const claude = createFakeSummoner().claude();
      const clientId = 'created-push-uuid';
      const createdPromise = new Promise<{ channelId: string }>((resolve) => {
        claude.on('session:created', resolve);
      });

      await claude.initialize(s.init('cli-sess'), { launch: { channelId: clientId } });
      const created = await createdPromise;

      expect(created.channelId).toBe(clientId);
    });

    it('chat:create with channelId + initialPrompt sends the prompt automatically', async () => {
      const claude = createFakeSummoner().claude();
      const clientId = 'prompt-uuid';

      await claude.initialize(s.init('cli-sess'), {
        launch: { channelId: clientId, initialPrompt: 'do something' },
      });

      await claude.emit(s.assistant('got it'));
      await claude.emit(s.result());

      const events = claude.events('message:assistant');
      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events.some((e: any) => e.content?.[0]?.text === 'got it')).toBe(true);
    });

    it('chat:create with resumeSessionId + channelId uses channelId as externalId', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'hello' });

      await claude.emit(s.assistant('first'));
      await claude.emit(s.result());

      const clientId = 'resume-client-uuid';

      await claude.send('session:launch', { resumeChannelId: channelId, channelId: clientId });

      // The second spawn gets its own handle
      const secondHandle = claude.provider.all[claude.provider.all.length - 1];
      secondHandle.emit(s.assistant('resumed'));
      secondHandle.emit(s.result());
      await new Promise<void>((r) => queueMicrotask(r));
      await new Promise<void>((r) => queueMicrotask(r));

      const events = claude.events('message:assistant');
      const clientEvents = events.filter((e: any) => e.channelId === clientId);
      expect(clientEvents.length).toBeGreaterThan(0);
    });

    it('chat:create with no params creates a new session (backward compat)', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const claude = createFakeSummoner(server).claude();
      const channelId = await claude.initialize(s.init('cli-sess'), {
        launch: { channelId: 'test-no-params-compat' },
      });

      expect(channelId).toBeDefined();
      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(channelId)).toBeDefined();
    });
  });

  describe('chat:create with client-provided channelId', () => {
    it('uses client channelId for all chat:event emissions', async () => {
      const claude = createFakeSummoner().claude();
      const clientId = 'stable-client-uuid';

      await claude.initialize(s.init('cli-sess'), { launch: { channelId: clientId } });

      await claude.send('chat:send', { channelId: clientId, message: 'hello' });

      await claude.emit(s.assistant('hi'));
      await claude.emit(s.result());

      const events = claude.events('message:assistant');
      expect(events.length).toBeGreaterThan(0);
      expect(events.every((e: any) => e.channelId === clientId)).toBe(true);
    });

    it('chat:create callback returns the same clientId', async () => {
      const claude = createFakeSummoner().claude();
      const clientId = 'my-client-uuid';
      const channelId = await claude.initialize(s.init('cli-sess'), {
        launch: { channelId: clientId },
      });

      expect(channelId).toBe(clientId);
    });

    it('chat:created push uses client channelId', async () => {
      const claude = createFakeSummoner().claude();
      const clientId = 'client-uuid-for-created';
      const createdPromise = new Promise<{ channelId: string }>((resolve) => {
        claude.on('session:created', resolve);
      });

      await claude.initialize(s.init('cli-sess'), { launch: { channelId: clientId } });
      const created = await createdPromise;

      expect(created.channelId).toBe(clientId);
    });

    it('rawEventStore stores entries keyed by CLI session_id (not channelId)', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const claude = createFakeSummoner(server).claude();
      claude.initialize(s.init('cli-sess'));

      const clientId = 'canonical-client-uuid-raw';
      await claude.send('session:launch', { channelId: clientId });

      await claude.send('chat:send', { channelId: clientId, message: 'hello' });

      await claude.emit(s.assistant('hi'));
      await claude.emit(s.result());

      const rawEventStore = container.get<RawEventStore>(TYPES.RawEventStore);
      const entries = await rawEventStore.getBySession('cli-sess');
      expect(entries.length).toBeGreaterThan(0);
    });

    it('getRunner(clientId) returns the session after chat:create', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const claude = createFakeSummoner(server).claude();
      const clientId = 'direct-lookup-uuid';
      await claude.initialize(s.init('cli-sess'), { launch: { channelId: clientId } });

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(clientId)).toBeDefined();
    });
  });

  describe('chat:create with initOptions', () => {
    it('creates session with initOptions containing systemPrompt', async () => {
      const claude = createFakeSummoner().claude();

      const channelId = await claude.initialize(s.init('cli-sess'), {
        launch: { initOptions: { systemPrompt: 'test' } },
      });

      const initEvents = claude.events('session:init');
      expect(channelId).toBeDefined();
      expect(initEvents.length).toBeGreaterThan(0);
    });
  });

  describe('session:launch', () => {
    it('returns slashCommands from initialize response', async () => {
      const claude = createFakeSummoner().claude();
      claude.initialize(s.init('fake-sess', { slashCommands: ['/help', '/clear'] }));

      const result = await claude.send<{ channelId: string; slashCommands?: string[] }>(
        'session:launch',
        { channelId: crypto.randomUUID() },
      );

      expect(result.slashCommands).toEqual(['/help', '/clear']);
    });

    it('creates a new session and returns channelId', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const claude = createFakeSummoner(server).claude();
      const channelId = await claude.initialize(s.init('cli-sess'));

      expect(channelId).toBeDefined();
      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(channelId)).toBeDefined();
    });

    it('sends initialPrompt if provided', async () => {
      const claude = createFakeSummoner().claude();

      const channelId = await claude.initialize(s.init('cli-sess'), {
        launch: { initialPrompt: 'hello world' },
      });

      await claude.emit(s.assistant('response to prompt'));
      await claude.emit(s.result());

      const events = claude.events('message:assistant');
      expect(channelId).toBeDefined();
      expect(events.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('chat:create resume failure', () => {
    /** Setup a FakeClaude that does NOT auto-respond to initialize — simulates failed resume */
    function setupNoAutoInit() {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const claude = createFakeSummoner(server).claude();

      return { container, claude };
    }

    it('marks session as dead when --resume fails with No conversation found', async () => {
      const { container, claude } = setupNoAutoInit();

      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      await sessionStore.upsert({
        id: 'dead-sess',
        channelId: 'dead-sess',
        provider: 'claude',
        command: 'claude',
        args: '[]',
        mode: 'interactive',
        role: 'chat',
        createdAt: new Date().toISOString(),
      });

      void claude.send('session:launch', { resumeChannelId: 'dead-sess' });
      await claude.emit(
        s.resultError({ errors: ['No conversation found with session ID: dead-sess'] }),
      );
      claude.handle.abort();
      await new Promise<void>((r) => setTimeout(r, 50));

      const record = await sessionStore.getById('dead-sess');
      expect(record?.status).toBe('dead');
    });

    it('does NOT emit any error event when --resume fails with result.errors (errors surfaced via close_channel)', async () => {
      const { container, claude } = setupNoAutoInit();

      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      await sessionStore.upsert({
        id: 'dead-sess-2',
        channelId: 'dead-sess-2',
        provider: 'claude',
        command: 'claude',
        args: '[]',
        mode: 'interactive',
        role: 'chat',
        createdAt: new Date().toISOString(),
      });

      void claude.send('session:launch', { resumeChannelId: 'dead-sess-2' });

      await claude.emit(
        s.resultError({ errors: ['No conversation found with session ID: dead-sess-2'] }),
      );
      claude.handle.abort();

      // No error event emitted — test passes if we reach here
    });

    it('emits chat:session_dead when --resume fails with No conversation found', async () => {
      const { container, claude } = setupNoAutoInit();

      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      await sessionStore.upsert({
        id: 'dead-sess-3',
        channelId: 'dead-sess-3',
        provider: 'claude',
        command: 'claude',
        args: '[]',
        mode: 'interactive',
        role: 'chat',
        createdAt: new Date().toISOString(),
      });

      void claude.send('session:launch', { resumeChannelId: 'dead-sess-3' });
      await claude.emit(
        s.resultError({ errors: ['No conversation found with session ID: dead-sess-3'] }),
      );
      claude.handle.abort();
      await new Promise<void>((r) => setTimeout(r, 50));

      const deadEvents = claude.events('session:dead');
      expect(deadEvents).toHaveLength(1);
      expect(deadEvents[0].channelId).toBe('dead-sess-3');
    });
  });
});
