import { segments as s } from '@code-quest/summoner/test';
import { createFakeClaude } from '../test/index.ts';

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
