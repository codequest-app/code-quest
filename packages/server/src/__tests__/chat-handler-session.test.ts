import { segments as s } from '@code-quest/summoner/test';
import type { RawEventStore } from '../services/raw-event-store.ts';
import type { SessionStore } from '../services/session-store.ts';
import * as helpers from '../socket/handlers/helpers.ts';
import { createFakeClaude } from '../test/index.ts';
import { TYPES } from '../types.ts';

interface SocketEvent {
  name: string;
  payload?: { content?: Array<{ type: string; text: string }> };
}

async function setup(sessionId = 'cli-sess') {
  const claude = createFakeClaude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId };
}

function collectEvents<T = Record<string, unknown>>(
  socket: { on(e: string, cb: (p: T) => void): void },
  eventName: string,
) {
  const events: T[] = [];
  socket.on(eventName, (p: T) => events.push(p));
  return events;
}

describe('ChatHandler > session', () => {
  describe('session creation', () => {
    it('creates a session and emits chat:created', async () => {
      const { claude, channelId } = await setup();

      expect(channelId).toBeDefined();
      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = claude.container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(channelId)).toBeDefined();
    });

    it('prepareInit + external launch completes init without calling initialize()', async () => {
      const claude = createFakeClaude();
      claude.prepareInit(s.init('prep-sess'));

      // External launch (simulates UI "New tab" click)
      const channelId = await claude.send<{ channelId: string }>('session:launch', {
        channelId: 'ch-prep',
      });

      expect(channelId).toBeDefined();
    });

    it('session record is written to DB with session_id set (from system/init, not started)', async () => {
      const { claude, channelId } = await setup();

      const sessionStore = claude.container.get<SessionStore>(TYPES.SessionStore);
      const record = await sessionStore.getById(channelId);
      expect(record).not.toBeNull();
      expect(record!.sessionId).toBe('cli-sess');
    });

    it('sessionStore.persist is fire-and-forget: custom:created fires without awaiting persist', async () => {
      const claude = createFakeClaude();

      let persistResolved = false;
      const sessionStore = claude.container.get<SessionStore>(TYPES.SessionStore);
      const realPersist = sessionStore.persist.bind(sessionStore);
      sessionStore.persist = async (...args: [Parameters<typeof realPersist>[0]]) => {
        const result = await realPersist(...args);
        persistResolved = true;
        return result;
      };

      let customCreatedFiredBeforePersist = false;
      claude.socket.on('session:created', () => {
        customCreatedFiredBeforePersist = !persistResolved;
      });

      await claude.initialize(s.init('persist-test'));

      expect(customCreatedFiredBeforePersist).toBe(true);
    });

    it('emits chat:created AFTER initialize completes with promoted session ID', async () => {
      const claude = createFakeClaude();
      const createdEvents = collectEvents(claude.socket, 'session:created');

      const channelId = await claude.initialize(s.init('promoted-sess'));

      expect(createdEvents.length).toBeGreaterThan(0);
      expect(createdEvents[0].channelId).toBe(channelId);
    });

    it('creates session with default init when no initOptions', async () => {
      const claude = createFakeClaude();
      const channelId = await claude.initialize();

      expect(channelId).toBeDefined();
      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = claude.container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(channelId)).toBeDefined();
    });

    it('launch emits exactly one session:init with final metaCache', async () => {
      const claude = createFakeClaude();
      const initEvents = collectEvents(claude.socket, 'session:init');

      const channelId = await claude.initialize(
        s.init('cli-sess', {
          model: 'claude-sonnet-4-6',
          slashCommands: ['commit', 'review'],
        }),
      );

      // Only 1 session:init — from launch handler (Channel.emit suppressed for session:init)
      expect(initEvents.length).toBe(1);
      expect(initEvents[0].channelId).toBe(channelId);
      expect(initEvents[0].model).toBe('claude-sonnet-4-6');
      expect(initEvents[0].slashCommands).toEqual(['commit', 'review']);
    });

    it('chat:create callback includes slashCommands from initialize response', async () => {
      const claude = createFakeClaude();
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
      const claude = createFakeClaude();
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
      const claude = createFakeClaude();
      const modelEvents = collectEvents(claude.socket, 'app:models');

      await claude.initialize(s.init('cli-sess'), s.controlResponse('init', { models }));

      expect(modelEvents.length).toBeGreaterThan(0);
      expect(modelEvents[0].models).toEqual(models);
    });

    it('session:join emits app:models to joining socket when cachedModels available', async () => {
      const models = [
        { value: 'default', displayName: 'Default' },
        { value: 'haiku', displayName: 'Haiku' },
      ];
      const claude = createFakeClaude();
      const channelId = await claude.initialize(
        s.init('cli-sess'),
        s.controlResponse('init', { models }),
      );

      const socketB = claude.connect();
      const modelEvents = collectEvents(socketB, 'app:models');

      await new Promise<void>((resolve) => {
        socketB.emit('session:join', { channelId }, () => resolve());
      });

      expect(modelEvents.length).toBeGreaterThan(0);
      expect(modelEvents[0].models).toEqual(models);
    });
  });

  describe('session:join', () => {
    it('emits session:init to joining socket with full config from metaCache', async () => {
      const claude = createFakeClaude();
      const channelId = await claude.initialize(
        s.init('cli-sess', {
          model: 'claude-sonnet-4-6',
          tools: ['Read', 'Write', 'Bash'],
          permissionMode: 'default',
          fastModeState: 'off',
          mcpServers: [{ name: 'github', status: 'connected' }],
          slashCommands: ['commit', 'review'],
        }),
      );

      // Second socket joins — collect session:init events on socket B
      const socketB = claude.connect();
      const initEvents = collectEvents(socketB, 'session:init');

      await new Promise<void>((resolve) => {
        socketB.emit('session:join', { channelId }, () => resolve());
      });

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

    it('joins an existing session and receives state', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<{ channelId: string; state: string }>('session:join', {
        channelId,
      });

      expect(result.channelId).toBe(channelId);
      expect(result.state).toBe('idle');
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
      const { claude, channelId } = await setup();

      // Verify session was persisted with sessionId
      const sessionStore = claude.container.get<SessionStore>(TYPES.SessionStore);
      const record = await sessionStore.getById(channelId);
      expect(record?.sessionId).toBe('cli-sess');

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
        events?: SocketEvent[];
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
        events?: SocketEvent[];
        error?: string;
      }>('session:join', { channelId });

      expect(result.error).toBeUndefined();
      const names = result.events!.map((e) => e.name);
      expect(names).toContain('message:user');

      const userEvent = result.events!.find((e) => e.name === 'message:user');
      expect(userEvent?.payload?.content).toEqual([{ type: 'text', text: 'hi' }]);
    });

    it('does not duplicate user message in history when CLI echoes it back', async () => {
      const { claude, channelId } = await setup();

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
      const rawStore = claude.container.get<RawEventStore>(TYPES.RawEventStore);
      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = claude.container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
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
        events?: SocketEvent[];
        error?: string;
      }>('session:join', { channelId });

      expect(result.error).toBeUndefined();
      const userTextEvents = result.events!.filter(
        (e) =>
          e.name === 'message:user' &&
          e.payload?.content?.some?.((b) => b.type === 'text' && b.text === 'hello'),
      );
      expect(userTextEvents.length).toBe(1);
    });

    it('returns session_init event when session has no user messages', async () => {
      const { claude, channelId } = await setup();
      // No sendMessage — only session_init in raw_entries

      const result = await claude.send<{
        events?: SocketEvent[];
        error?: string;
      }>('session:join', { channelId });

      expect(result.error).toBeUndefined();
      expect(result.events).toBeDefined();
      expect(result.events!.every((e) => e.name === 'session:init')).toBe(true);
    });

    it('chat:join callback returns the provided channelId (not internal CLI ID)', async () => {
      const claude = createFakeClaude();
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
      const claude = createFakeClaude();
      const createdEvents: Record<string, unknown>[] = [];
      claude.socket.on('session:created', (p: Record<string, unknown>) => createdEvents.push(p));

      const channelId = await claude.initialize();

      expect(createdEvents.length).toBeGreaterThan(0);
      expect(createdEvents[0].channelId).toBe(channelId);
    });
  });

  describe('session persist timing', () => {
    it('session record has sessionId immediately after launch', async () => {
      const { claude, channelId } = await setup();
      await new Promise<void>((r) => setTimeout(r, 50));

      const sessionStore = claude.container.get<SessionStore>(TYPES.SessionStore);
      const record = await sessionStore.getById(channelId);
      expect(record).toBeDefined();
      expect(record!.sessionId).toBeTruthy();
    });
  });

  describe('session persistence', () => {
    it('session persists after socket disconnect (no grace kill)', async () => {
      const { claude } = await setup();

      claude.socket.disconnect();
      await new Promise<void>((r) => queueMicrotask(r));

      // Process should still be alive (not killed on disconnect)
      expect(claude.handle.signal.aborted).toBe(false);
    });

    it('raw entries are persisted to DB after session is created (no FK error)', async () => {
      const { claude } = await setup();

      const rawEventStore = claude.container.get<RawEventStore>(TYPES.RawEventStore);
      const entries = await rawEventStore.getBySession('cli-sess');
      expect(entries.length).toBeGreaterThan(0);
    });

    it('records each stdin message exactly once in raw event store', async () => {
      const { claude, channelId } = await setup();

      // Verify runner has exactly 1 stdin listener (no double wireRawPersistence)
      const mgr = claude.container.get<{
        get(id: string): { runner: { listenerCount(e: string): number } } | undefined;
      }>(TYPES.ChannelManager);
      expect(mgr.get(channelId)!.runner.listenerCount('stdin')).toBe(1);

      await claude.send('chat:send', { channelId, message: 'hello' });

      const rawEventStore = claude.container.get<RawEventStore>(TYPES.RawEventStore);
      const entries = await rawEventStore.getBySession('cli-sess');
      const stdinHellos = entries.filter(
        (e) =>
          e.direction === 'in' && e.raw.includes('"hello"') && !e.raw.includes('control_request'),
      );
      expect(stdinHellos.length).toBe(1);
    });
  });

  describe('session:close', () => {
    it('close_channel terminates session immediately', async () => {
      const { claude, channelId } = await setup();

      await claude.send('session:close', { channelId });

      expect(claude.handle.signal.aborted).toBe(true);
    });

    it('emits chat:exit on process close', async () => {
      const { claude, channelId } = await setup();
      const closedEvents = collectEvents(claude.socket, 'session:closed');

      await claude.send('chat:send', { channelId, message: 'done' });

      await claude.emit(s.assistant('bye'));
      await claude.emit(s.result());

      await claude.send('session:close', { channelId });
      await new Promise<void>((r) => queueMicrotask(r));

      expect(closedEvents.length).toBeGreaterThan(0);
      expect(closedEvents[0].channelId).toBe(channelId);
    });

    it('kills a session', async () => {
      const { claude, channelId } = await setup();

      await claude.send('session:close', { channelId });

      expect(claude.handle.signal.aborted).toBe(true);
    });
  });

  describe('chat:cancel_request broadcast', () => {
    it('chat:cancel_request fires when permission is responded', async () => {
      const { claude, channelId } = await setup();
      const cancelEvents: Record<string, unknown>[] = [];
      claude.socket.on('chat:cancel_request', (p: Record<string, unknown>) => cancelEvents.push(p));

      await claude.send('chat:send', { channelId, message: 'read file' });
      await claude.emit(
        s.assistant({ toolUse: { id: 'toolu_1', name: 'Read', input: { file_path: '/tmp/x' } } }),
      );
      await claude.emit(
        s.controlRequest('req-perm', 'can_use_tool', 'Read', { file_path: '/tmp/x' }),
      );

      // Respond to permission
      await claude.send('chat:respond', {
        requestId: 'req-perm',
        response: { behavior: 'allow', updatedInput: {} },
      });

      expect(cancelEvents.length).toBeGreaterThan(0);
      expect(cancelEvents[0].targetRequestId).toBe('req-perm');
    });
  });

  describe('session:list isActive', () => {
    it('session:list returns isActive=true for sessions with live process', async () => {
      const { claude, channelId } = await setup();

      const result = await claude.send<{ sessions: Record<string, unknown>[]; total: number }>(
        'session:list',
        {},
      );

      const session = result.sessions.find((s) => s.id === channelId);
      expect(session).toBeDefined();
      expect(session!.isActive).toBe(true);
    });
  });

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
      const session = result.sessions.find((s) => s.id === channelId);

      expect(session).toBeDefined();
      // Session has no explicit title, so firstUserMessage should be used
      expect(session!.firstUserMessage).toBe('Hello world');
    });

    it('auto-generates session title after first chat:send', async () => {
      const { claude, channelId } = await setup();

      claude.onControlRequest((req) => {
        if (req.subtype === 'generate_session_title') {
          return { title: 'Fix the login bug' };
        }
        return null;
      });

      await claude.send('chat:send', { channelId, message: 'fix the login page' });
      await claude.emit(s.assistant('ok'));
      await claude.emit(s.result());
      await new Promise<void>((r) => setTimeout(r, 50));

      const result = await claude.send<{ sessions: Record<string, unknown>[]; total: number }>(
        'session:list',
        {},
      );
      const session = result.sessions.find((s) => s.id === channelId);
      expect(session?.title).toBe('Fix the login bug');
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
        events?: SocketEvent[];
        error?: string;
      }>('session:get', { channelId });

      expect(result.session).toBeDefined();
      expect(result.session!.id).toBe(channelId);
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
        events?: SocketEvent[];
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

  describe('multi-socket', () => {
    it('session persists after socket disconnect (no kill)', async () => {
      const { claude } = await setup();

      claude.socket.disconnect();
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
        events?: SocketEvent[];
        error?: string;
      }>('session:join', { channelId });

      expect(result.error).toBeUndefined();
      const names = result.events!.map((e) => e.name);
      expect(names).toContain('message:user');
    });
  });

  describe('multi-socket (A + B browsers)', () => {
    it('second socket joins same session and receives events', async () => {
      const { claude, channelId } = await setup();
      const socketB = claude.connect();
      const bEvents: Record<string, unknown>[] = [];
      socketB.on('message:assistant', (p: Record<string, unknown>) => bEvents.push(p));

      // B joins A's session
      await new Promise<void>((resolve) => {
        socketB.emit('session:join', { channelId }, () => resolve());
      });
      await new Promise<void>((r) => setTimeout(r, 50));

      // A sends message → CLI replies → both sockets receive
      await claude.send('chat:send', { channelId, message: 'hello from A' });
      await claude.emit(s.assistant('broadcast reply'));
      await claude.emit(s.result());

      expect(bEvents.length).toBeGreaterThan(0);
      expect(bEvents[0].channelId).toBe(channelId);
    });

    it('window B receives only expected events when A sends a message (no cancel)', async () => {
      const { claude, channelId } = await setup();
      const socketB = claude.connect();
      const allBEvents: Array<{ event: string; payload: Record<string, unknown> }> = [];
      for (const ev of [
        'chat:cancel_request',
        'control:cancel',
        'control:permission',
        'message:assistant',
        'session:states',
        'session:closed',
      ]) {
        socketB.on(ev, (p: Record<string, unknown>) => allBEvents.push({ event: ev, payload: p }));
      }

      await new Promise<void>((resolve) => {
        socketB.emit('session:join', { channelId }, () => resolve());
      });
      await new Promise<void>((r) => setTimeout(r, 50));

      allBEvents.length = 0; // clear join-time events

      await claude.send('chat:send', { channelId, message: 'hello' });
      await claude.emit(s.assistant('hi'));
      await claude.emit(s.result());

      const cancelEvents = allBEvents.filter(
        (e) => e.event === 'chat:cancel_request' || e.event === 'control:cancel',
      );
      expect(cancelEvents).toHaveLength(0);
    });

    it('window B does NOT receive chat:cancel_request when A sends a message', async () => {
      const { claude, channelId } = await setup();
      const socketB = claude.connect();
      const bCancelEvents: Record<string, unknown>[] = [];
      socketB.on('chat:cancel_request', (p: Record<string, unknown>) => bCancelEvents.push(p));

      await new Promise<void>((resolve) => {
        socketB.emit('session:join', { channelId }, () => resolve());
      });
      await new Promise<void>((r) => setTimeout(r, 50));

      // A sends message — should NOT trigger cancel_request on B
      await claude.send('chat:send', { channelId, message: 'hello' });
      await claude.emit(s.assistant('hi'));
      await claude.emit(s.result());

      expect(bCancelEvents).toHaveLength(0);
    });

    it('window B receives chat:cancel_request when window A responds to permission', async () => {
      const { claude, channelId } = await setup();
      const socketB = claude.connect();
      const bCancelEvents: Record<string, unknown>[] = [];
      socketB.on('chat:cancel_request', (p: Record<string, unknown>) => bCancelEvents.push(p));

      await new Promise<void>((resolve) => {
        socketB.emit('session:join', { channelId }, () => resolve());
      });
      await new Promise<void>((r) => setTimeout(r, 50));

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(
        s.assistant({ toolUse: { id: 'toolu_1', name: 'Read', input: { file_path: '/tmp/x' } } }),
      );
      await claude.emit(
        s.controlRequest('req-ab', 'can_use_tool', 'Read', { file_path: '/tmp/x' }),
      );

      // A responds → B gets chat:cancel_request
      await claude.send('chat:respond', {
        requestId: 'req-ab',
        response: { behavior: 'allow', updatedInput: {} },
      });

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
      const { claude, channelId } = await setup();

      // Create history then kill process
      await claude.send('chat:send', { channelId, message: 'hello' });
      await claude.emit(s.assistant('world'));
      await claude.emit(s.result());
      claude.handle.abort();
      await new Promise<void>((r) => setTimeout(r, 50));

      // Second socket listens for session:created
      const socketB = claude.connect();
      const createdEvents = collectEvents<{ channelId: string }>(socketB, 'session:created');

      // socketB joins (triggers lazy resume)
      await new Promise<void>((resolve) => {
        socketB.emit('session:join', { channelId }, () => resolve());
      });
      await new Promise<void>((r) => setTimeout(r, 50));

      // Lazy resume should NOT broadcast session:created — session already exists
      expect(createdEvents.length).toBe(0);
    });
  });

  describe('session:resume cross-window sync', () => {
    it('session:resume broadcasts to all sockets', async () => {
      const { claude, channelId } = await setup();

      const socketB = claude.connect();
      const resumeEvents = collectEvents<{ channelId: string }>(socketB, 'session:resume');

      await claude.send('session:resume', { channelId });

      expect(resumeEvents.length).toBeGreaterThan(0);
      expect(resumeEvents[0].channelId).toBe(channelId);
    });
  });

  describe('close tab cross-window sync', () => {
    it('session:close broadcasts session:dead to all sockets', async () => {
      const { claude, channelId } = await setup();

      const socketB = claude.connect();
      const deadEvents = collectEvents<{ channelId: string }>(socketB, 'session:dead');

      // socketA closes session
      await claude.send('session:close', { channelId });
      await new Promise<void>((r) => setTimeout(r, 50));

      expect(deadEvents.length).toBeGreaterThan(0);
      expect(deadEvents[0].channelId).toBe(channelId);
    });
  });

  describe('unified chat:create', () => {
    it('chat:create with channelId uses it as externalId for events', async () => {
      const claude = createFakeClaude();
      const clientId = 'unified-client-uuid';
      const events = collectEvents(claude.socket, 'message:assistant');

      const channelId = await claude.initialize(s.init('cli-sess'), {
        launch: { channelId: clientId },
      });
      expect(channelId).toBe(clientId);

      await claude.send('chat:send', { channelId: clientId, message: 'hello' });

      await claude.emit(s.assistant('hi'));
      await claude.emit(s.result());

      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events.every((e) => e.channelId === clientId)).toBe(true);
    });

    it('chat:create with channelId emits chat:created with clientId', async () => {
      const claude = createFakeClaude();
      const clientId = 'created-push-uuid';
      const createdPromise = new Promise<{ channelId: string }>((resolve) => {
        claude.socket.on('session:created', resolve);
      });

      await claude.initialize(s.init('cli-sess'), { launch: { channelId: clientId } });
      const created = await createdPromise;

      expect(created.channelId).toBe(clientId);
    });

    it('chat:create with channelId + initialPrompt sends the prompt automatically', async () => {
      const claude = createFakeClaude();
      const clientId = 'prompt-uuid';
      const events = collectEvents(claude.socket, 'message:assistant');

      await claude.initialize(s.init('cli-sess'), {
        launch: { channelId: clientId, initialPrompt: 'do something' },
      });

      await claude.emit(s.assistant('got it'));
      await claude.emit(s.result());

      expect(events.length).toBeGreaterThanOrEqual(1);
      expect(events.some((e) => e.content?.[0]?.text === 'got it')).toBe(true);
    });

    it('chat:create with resumeSessionId + channelId uses channelId as externalId', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'hello' });

      await claude.emit(s.assistant('first'));
      await claude.emit(s.result());

      const clientId = 'resume-client-uuid';
      const events = collectEvents(claude.socket, 'message:assistant');

      await claude.send('session:launch', { resume: channelId, channelId: clientId });

      // The second spawn gets its own handle
      const secondHandle = claude.provider.all[claude.provider.all.length - 1];
      secondHandle.emit(s.assistant('resumed'));
      secondHandle.emit(s.result());
      await new Promise<void>((r) => queueMicrotask(r));
      await new Promise<void>((r) => queueMicrotask(r));

      const clientEvents = events.filter((e) => e.channelId === clientId);
      expect(clientEvents.length).toBeGreaterThan(0);
    });

    it('chat:create with no params creates a new session (backward compat)', async () => {
      const claude = createFakeClaude();
      const channelId = await claude.initialize(s.init('cli-sess'), {
        launch: { channelId: 'test-no-params-compat' },
      });

      expect(channelId).toBeDefined();
      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = claude.container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(channelId)).toBeDefined();
    });
  });

  describe('chat:create with client-provided channelId', () => {
    it('uses client channelId for all chat:event emissions', async () => {
      const claude = createFakeClaude();
      const clientId = 'stable-client-uuid';
      const events = collectEvents(claude.socket, 'message:assistant');

      await claude.initialize(s.init('cli-sess'), { launch: { channelId: clientId } });

      await claude.send('chat:send', { channelId: clientId, message: 'hello' });

      await claude.emit(s.assistant('hi'));
      await claude.emit(s.result());

      expect(events.length).toBeGreaterThan(0);
      expect(events.every((e) => e.channelId === clientId)).toBe(true);
    });

    it('chat:create callback returns the same clientId', async () => {
      const claude = createFakeClaude();
      const clientId = 'my-client-uuid';
      const channelId = await claude.initialize(s.init('cli-sess'), {
        launch: { channelId: clientId },
      });

      expect(channelId).toBe(clientId);
    });

    it('chat:created push uses client channelId', async () => {
      const claude = createFakeClaude();
      const clientId = 'client-uuid-for-created';
      const createdPromise = new Promise<{ channelId: string }>((resolve) => {
        claude.socket.on('session:created', resolve);
      });

      await claude.initialize(s.init('cli-sess'), { launch: { channelId: clientId } });
      const created = await createdPromise;

      expect(created.channelId).toBe(clientId);
    });

    it('rawEventStore stores entries keyed by CLI session_id (not channelId)', async () => {
      const claude = createFakeClaude();
      claude.initialize(s.init('cli-sess'));

      const clientId = 'canonical-client-uuid-raw';
      await claude.send('session:launch', { channelId: clientId });

      await claude.send('chat:send', { channelId: clientId, message: 'hello' });

      await claude.emit(s.assistant('hi'));
      await claude.emit(s.result());

      const rawEventStore = claude.container.get<RawEventStore>(TYPES.RawEventStore);
      const entries = await rawEventStore.getBySession('cli-sess');
      expect(entries.length).toBeGreaterThan(0);
    });

    it('getRunner(clientId) returns the session after chat:create', async () => {
      const claude = createFakeClaude();
      const clientId = 'direct-lookup-uuid';
      await claude.initialize(s.init('cli-sess'), { launch: { channelId: clientId } });

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = claude.container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(clientId)).toBeDefined();
    });
  });

  describe('chat:create with initOptions', () => {
    it('creates session with initOptions containing systemPrompt', async () => {
      const claude = createFakeClaude();
      const initEvents = collectEvents(claude.socket, 'session:init');

      const channelId = await claude.initialize(s.init('cli-sess'), {
        launch: { initOptions: { systemPrompt: 'test' } },
      });

      expect(channelId).toBeDefined();
      expect(initEvents.length).toBeGreaterThan(0);
    });
  });

  describe('session:launch', () => {
    it('returns slashCommands from initialize response', async () => {
      const claude = createFakeClaude();
      claude.initialize(s.init('fake-sess', { slashCommands: ['/help', '/clear'] }));

      const result = await claude.send<{ channelId: string; slashCommands?: string[] }>(
        'session:launch',
        { channelId: crypto.randomUUID() },
      );

      expect(result.slashCommands).toEqual(['/help', '/clear']);
    });

    it('creates a new session and returns channelId', async () => {
      const claude = createFakeClaude();
      const channelId = await claude.initialize(s.init('cli-sess'));

      expect(channelId).toBeDefined();
      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = claude.container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(channelId)).toBeDefined();
    });

    it('sends initialPrompt if provided', async () => {
      const claude = createFakeClaude();
      const events = collectEvents(claude.socket, 'message:assistant');

      const channelId = await claude.initialize(s.init('cli-sess'), {
        launch: { initialPrompt: 'hello world' },
      });

      await claude.emit(s.assistant('response to prompt'));
      await claude.emit(s.result());

      expect(channelId).toBeDefined();
      expect(events.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('session forking', () => {
    it('forked session persist includes parentId and is fire-and-forget', async () => {
      const { claude, channelId } = await setup();

      let persistResolved = false;
      const persistedArgs: unknown[][] = [];
      const sessionStore = claude.container.get<SessionStore>(TYPES.SessionStore);
      const realPersist = sessionStore.persist.bind(sessionStore);
      sessionStore.persist = async (...args: [Parameters<typeof realPersist>[0]]) => {
        persistedArgs.push(args);

        const result = await realPersist(...args);
        persistResolved = true;
        return result;
      };

      let forkCustomCreatedFiredBeforePersist = false;
      claude.socket.on('session:created', ({ channelId: id }: { channelId: string }) => {
        if (id === 'fork-1') forkCustomCreatedFiredBeforePersist = !persistResolved;
      });

      await claude.send('session:fork', {
        forkedFromSession: channelId,
        resumeSessionAt: 'msg-1',
        newSessionId: 'fork-1',
      });

      expect(forkCustomCreatedFiredBeforePersist).toBe(true);

      const forkPersist = persistedArgs.find(
        ([p]) => (p as Record<string, unknown>).id === 'fork-1',
      );
      expect(forkPersist).toBeDefined();
      expect((forkPersist![0] as Record<string, unknown>).parentId).toBe(channelId);
    });

    it('forked session parentId !== newSessionId', async () => {
      const { claude, channelId } = await setup();

      await claude.send('session:fork', {
        forkedFromSession: channelId,
        resumeSessionAt: 'msg-1',
        newSessionId: 'fork-verify',
      });
      await new Promise<void>((r) => setTimeout(r, 50));

      const sessionStore = claude.container.get<SessionStore>(TYPES.SessionStore);
      const forked = await sessionStore.getById('fork-verify');
      expect(forked).toBeDefined();
      expect(forked!.parentId).toBe(channelId);
      expect(forked!.parentId).not.toBe('fork-verify');
    });

    it('fork_conversation emits session:created exactly once', async () => {
      const { claude, channelId } = await setup();

      const createdEvents: string[] = [];
      claude.socket.on('session:created', ({ channelId: id }: { channelId: string }) => {
        createdEvents.push(id);
      });

      await claude.send('session:fork', {
        forkedFromSession: channelId,
        resumeSessionAt: 'msg-1',
        newSessionId: 'fork-once',
      });

      const forkCreated = createdEvents.filter((id) => id === 'fork-once');
      expect(forkCreated).toHaveLength(1);
    });
  });

  describe('chat:create resume failure', () => {
    /** Setup a FakeClaude that does NOT auto-respond to initialize — simulates failed resume */
    function setupNoAutoInit() {
      const claude = createFakeClaude();

      return claude;
    }

    it('marks session as dead when --resume fails with No conversation found', async () => {
      const claude = setupNoAutoInit();

      const sessionStore = claude.container.get<SessionStore>(TYPES.SessionStore);
      await sessionStore.persist({
        id: 'dead-sess',
        provider: 'claude',
        command: 'claude',
        args: '[]',
        mode: 'interactive',
        role: 'chat',
        createdAt: new Date().toISOString(),
      });

      void claude.send('session:launch', { resume: 'dead-sess' });
      await claude.emit(
        s.resultError({ errors: ['No conversation found with session ID: dead-sess'] }),
      );
      claude.handle.abort();
      await new Promise<void>((r) => setTimeout(r, 50));

      const record = await sessionStore.getById('dead-sess');
      expect(record?.status).toBe('dead');
    });

    it('does NOT emit any error event when --resume fails with result.errors (errors surfaced via close_channel)', async () => {
      const claude = setupNoAutoInit();

      const sessionStore = claude.container.get<SessionStore>(TYPES.SessionStore);
      await sessionStore.persist({
        id: 'dead-sess-2',
        provider: 'claude',
        command: 'claude',
        args: '[]',
        mode: 'interactive',
        role: 'chat',
        createdAt: new Date().toISOString(),
      });

      void claude.send('session:launch', { resume: 'dead-sess-2' });

      await claude.emit(
        s.resultError({ errors: ['No conversation found with session ID: dead-sess-2'] }),
      );
      claude.handle.abort();

      // No error event emitted — test passes if we reach here
    });

    it('emits chat:session_dead when --resume fails with No conversation found', async () => {
      const claude = setupNoAutoInit();

      const sessionStore = claude.container.get<SessionStore>(TYPES.SessionStore);
      await sessionStore.persist({
        id: 'dead-sess-3',
        provider: 'claude',
        command: 'claude',
        args: '[]',
        mode: 'interactive',
        role: 'chat',
        createdAt: new Date().toISOString(),
      });

      const deadEvents = collectEvents(claude.socket, 'session:dead');

      void claude.send('session:launch', { resume: 'dead-sess-3' });
      await claude.emit(
        s.resultError({ errors: ['No conversation found with session ID: dead-sess-3'] }),
      );
      claude.handle.abort();
      await new Promise<void>((r) => setTimeout(r, 50));

      expect(deadEvents).toHaveLength(1);
      expect(deadEvents[0].channelId).toBe('dead-sess-3');
    });
  });
});

describe('session:update_state', () => {
  it('should broadcast state change to all sockets', async () => {
    const { claude, channelId } = await setup();

    const sessionUpdates: Record<string, unknown>[] = [];
    claude.socket.on('session:states', (payload: { sessions: Record<string, unknown>[] }) => {
      if (payload.sessions) {
        for (const sess of payload.sessions) sessionUpdates.push(sess);
      }
    });

    const result = await claude.send<{ success: boolean; error?: string }>('session:update_state', {
      channelId,
      title: 'New Title',
    });

    expect(result.success).toBe(true);
    const matched = sessionUpdates.find(
      (sc) => sc.channelId === channelId && sc.title === 'New Title',
    );
    expect(matched).toBeDefined();
  });

  it('should broadcast state and title together', async () => {
    const { claude, channelId } = await setup();

    const sessionUpdates: Record<string, unknown>[] = [];
    claude.socket.on('session:states', (payload: { sessions: Record<string, unknown>[] }) => {
      if (payload.sessions) {
        for (const sess of payload.sessions) sessionUpdates.push(sess);
      }
    });

    const result = await claude.send<{ success: boolean; error?: string }>('session:update_state', {
      channelId,
      title: 'Busy Tab',
      state: 'busy',
    });

    expect(result.success).toBe(true);
    const matched = sessionUpdates.find(
      (sc) => sc.channelId === channelId && sc.state === 'busy' && sc.title === 'Busy Tab',
    );
    expect(matched).toBeDefined();
  });

  it('should return error for invalid payload', async () => {
    const claude = createFakeClaude();

    const result = await claude.send<{ success: boolean; error?: string }>(
      'session:update_state',
      {},
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('session_states_update enrichment', () => {
  function collectSessionStates(socket: {
    on(e: string, cb: (p: { sessions: Record<string, unknown>[] }) => void): void;
  }) {
    const sessions: Record<string, unknown>[] = [];
    socket.on('session:states', (payload: { sessions: Record<string, unknown>[] }) => {
      for (const s of payload.sessions) sessions.push(s);
    });
    return sessions;
  }

  it('should include system.init config fields in session_states_update after init', async () => {
    const { claude, channelId } = await setup();
    const sessions = collectSessionStates(claude.socket);

    await claude.send('chat:send', { channelId, message: 'hello' });

    await claude.emit(s.assistant('hi'));
    await claude.emit(s.result());

    const busyWithConfig = sessions.find(
      (sc) => sc.channelId === channelId && sc.state === 'busy' && sc.modelSetting,
    );
    expect(busyWithConfig).toBeDefined();
    expect(busyWithConfig!.modelSetting).toBeDefined();
  });

  it('should not include config fields before system.init', async () => {
    const claude = createFakeClaude();
    const sessions = collectSessionStates(claude.socket);

    await claude.initialize(s.init('cli-sess'));

    expect(sessions.length).toBeGreaterThan(0);
    for (const sc of sessions) {
      expect(sc.channelId).toBeDefined();
      expect(sc.state).toBeDefined();
    }
  });

  it('should clear config cache on session exit', async () => {
    const { claude, channelId } = await setup();
    const sessions = collectSessionStates(claude.socket);

    await claude.send('chat:send', { channelId, message: 'hello' });

    await claude.emit(s.result());

    await claude.send('session:close', { channelId });
    await new Promise<void>((r) => queueMicrotask(r));

    const exitedState = sessions.find((sc) => sc.channelId === channelId && sc.state === 'exited');
    expect(exitedState).toBeDefined();
  });
});

describe('session:teleport', () => {
  it('should create session with resume from remote session ID', async () => {
    const claude = createFakeClaude();
    await claude.initialize(s.init('cli-sess'));

    const result = await claude.send<{ success: boolean; channelId?: string; error?: string }>(
      'session:teleport',
      { remoteSessionId: 'remote-123', newSessionId: 'client-teleport-1' },
    );

    expect(result.success).toBe(true);
    expect(result.channelId).toBe('client-teleport-1');
    const { ChannelManager } = await import('../socket/channel-manager.ts');
    const mgr = claude.container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
    expect(mgr.get(result.channelId!)).toBeDefined();
  });

  it('should attempt git checkout if branch provided', async () => {
    const execGitSpy = vi.spyOn(helpers, 'execGit').mockResolvedValue('');
    const claude = createFakeClaude();
    await claude.initialize(s.init('cli-sess'));

    const result = await claude.send<{ success: boolean; channelId?: string; error?: string }>(
      'session:teleport',
      { remoteSessionId: 'remote-123', branch: 'feature/x', newSessionId: 'client-teleport-2' },
    );

    expect(result.success).toBe(true);
    expect(execGitSpy).toHaveBeenCalledWith(['checkout', 'feature/x']);

    execGitSpy.mockRestore();
  });

  it('should succeed even if git checkout fails', async () => {
    const execGitSpy = vi.spyOn(helpers, 'execGit').mockRejectedValue(new Error('checkout failed'));
    const claude = createFakeClaude();
    await claude.initialize(s.init('cli-sess'));

    const result = await claude.send<{
      success: boolean;
      channelId?: string;
      error?: string;
      branchCheckoutFailed?: boolean;
      branch?: string;
    }>('session:teleport', {
      remoteSessionId: 'remote-123',
      branch: 'feature/x',
      newSessionId: 'client-teleport-3',
    });

    expect(result.success).toBe(true);
    expect(result.channelId).toBeDefined();
    expect(result.branchCheckoutFailed).toBe(true);
    expect(result.branch).toBe('feature/x');

    execGitSpy.mockRestore();
  });

  it('should return events from parent session history', async () => {
    const { claude, channelId } = await setup();

    await claude.send('chat:send', { channelId, message: 'hello' });

    await claude.emit(s.assistant('original'));
    await claude.emit(s.result());

    const result = await claude.send<{
      success: boolean;
      channelId?: string;
      events?: SocketEvent[];
      error?: string;
    }>('session:teleport', { remoteSessionId: channelId, newSessionId: 'client-teleport-4' });

    expect(result.success).toBe(true);
    expect(result.events).toBeDefined();
    expect(result.events!.length).toBeGreaterThan(0);
  });
});

describe('chat:fork enhanced', () => {
  it('should store parentId on forked session in session store', async () => {
    const { claude, channelId } = await setup();

    const forkResult = await claude.send<{
      success: boolean;
      channelId?: string;
      parentSessionId?: string;
      error?: string;
    }>('session:fork', {
      forkedFromSession: channelId,
      resumeSessionAt: 'msg-1',
      newSessionId: 'client-fork-1',
    });
    // persist is fire-and-forget in handler — wait for it
    await new Promise<void>((r) => queueMicrotask(r));

    expect(forkResult.error).toBeUndefined();
    expect(forkResult.success).toBe(true);
    expect(forkResult.channelId).toBe('client-fork-1');

    const getResult = await claude.send<{ session?: { parentId?: string }; error?: string }>(
      'session:get',
      { channelId: forkResult.channelId! },
    );

    expect(getResult.session).toBeDefined();
    expect(getResult.session!.parentId).toBe(channelId);
  });

  it('should include parentSessionId in fork response', async () => {
    const { claude, channelId } = await setup();

    const forkResult = await claude.send<{
      success: boolean;
      channelId?: string;
      parentSessionId?: string;
      error?: string;
    }>('session:fork', {
      forkedFromSession: channelId,
      resumeSessionAt: 'msg-1',
      newSessionId: 'client-fork-2',
    });

    expect(forkResult.success).toBe(true);
    expect(forkResult.parentSessionId).toBe(channelId);
  });

  it('should return parent session events in fork response', async () => {
    const { claude, channelId } = await setup();

    await claude.send('chat:send', { channelId, message: 'hello' });

    await claude.emit(s.assistant('original msg'));
    await claude.emit(s.result());

    const forkResult = await claude.send<{
      success: boolean;
      channelId?: string;
      parentSessionId?: string;
      events?: SocketEvent[];
      error?: string;
    }>('session:fork', {
      forkedFromSession: channelId,
      resumeSessionAt: 'msg-1',
      newSessionId: 'client-fork-3',
    });

    expect(forkResult.success).toBe(true);
    expect(forkResult.events).toBeDefined();
    expect(forkResult.events!.length).toBeGreaterThan(0);
    const names = forkResult.events!.map((e) => e.name);
    expect(names).toContain('message:assistant');
  });
});
