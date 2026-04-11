/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */
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
  describe('session forking', () => {
    it('forked session persist includes parentId and is fire-and-forget', async () => {
      const { container, claude, channelId } = await setup();

      let persistResolved = false;
      const persistedArgs: unknown[][] = [];
      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      const realPersist = sessionStore.persist.bind(sessionStore);
      sessionStore.persist = async (...args: [Parameters<typeof realPersist>[0]]) => {
        persistedArgs.push(args);

        const result = await realPersist(...args);
        persistResolved = true;
        return result;
      };

      let forkCustomCreatedFiredBeforePersist = false;
      claude.on('session:created', ({ channelId: id }: { channelId: string }) => {
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
      const { container, claude, channelId } = await setup();

      await claude.send('session:fork', {
        forkedFromSession: channelId,
        resumeSessionAt: 'msg-1',
        newSessionId: 'fork-verify',
      });
      await new Promise<void>((r) => setTimeout(r, 50));

      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      const forked = await sessionStore.getById('fork-verify');
      expect(forked).toBeDefined();
      expect(forked!.parentId).toBe(channelId);
      expect(forked!.parentId).not.toBe('fork-verify');
    });

    it('fork_conversation emits session:created exactly once', async () => {
      const { claude, channelId } = await setup();

      await claude.send('session:fork', {
        forkedFromSession: channelId,
        resumeSessionAt: 'msg-1',
        newSessionId: 'fork-once',
      });

      const forkCreated = claude
        .events('session:created')
        .filter((e: any) => e.channelId === 'fork-once');
      expect(forkCreated).toHaveLength(1);
    });
  });
});

describe('session:teleport', () => {
  it('should create session with resume from remote session ID', async () => {
    const container = createTestContainer();
    const server = createFakeServer(container);
    const claude = createFakeSummoner(server).claude();
    await claude.initialize(s.init('cli-sess'));

    const result = await claude.send<{ success: boolean; channelId?: string; error?: string }>(
      'session:teleport',
      { remoteSessionId: 'remote-123', newSessionId: 'client-teleport-1' },
    );

    expect(result.success).toBe(true);
    expect(result.channelId).toBe('client-teleport-1');
    const { ChannelManager } = await import('../socket/channel-manager.ts');
    const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
    expect(mgr.get(result.channelId!)).toBeDefined();
  });

  it('should attempt git checkout if branch provided', async () => {
    const summoner = createFakeSummoner();
    const claude = summoner.claude();
    await claude.initialize(s.init('cli-sess'));

    const result = await claude.send<{ success: boolean; channelId?: string; error?: string }>(
      'session:teleport',
      { remoteSessionId: 'remote-123', branch: 'feature/x', newSessionId: 'client-teleport-2' },
    );

    expect(result.success).toBe(true);
  });

  it('should succeed even if git checkout fails', async () => {
    const summoner = createFakeSummoner();
    summoner.git()!.setCheckoutError(new Error('checkout failed'));
    const claude = summoner.claude();
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
  });

  it('should return events from parent session history', async () => {
    const { claude, channelId } = await setup();

    await claude.send('chat:send', { channelId, message: 'hello' });

    await claude.emit(s.assistant('original'));
    await claude.emit(s.result());

    const result = await claude.send<{
      success: boolean;
      channelId?: string;
      events?: ClientMessage[];
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
      events?: ClientMessage[];
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
