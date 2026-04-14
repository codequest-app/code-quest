/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */
import type { ClientMessage } from '@code-quest/shared';
import { segments as s } from '@code-quest/summoner/test';
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
  describe('session forking', () => {
    it('forked session persist includes parentId and is fire-and-forget', async () => {
      const { container, claude, channelId } = await setup();

      let persistResolved = false;
      const persistedArgs: unknown[][] = [];
      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      const realPersist = sessionStore.upsert.bind(sessionStore);
      sessionStore.upsert = async (...args: [Parameters<typeof realPersist>[0]]) => {
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
        forkedFromChannelId: channelId,
        resumeSessionAt: 'msg-1',
        newChannelId: 'fork-1',
      });

      expect(forkCustomCreatedFiredBeforePersist).toBe(true);

      const forkPersist = persistedArgs.find(
        ([p]) => (p as Record<string, unknown>).channelId === 'fork-1',
      );
      expect(forkPersist).toBeDefined();
      expect((forkPersist![0] as Record<string, unknown>).parentId).toBe(channelId);
    });

    it('forked session parentId !== newChannelId', async () => {
      const { container, claude, channelId } = await setup();

      await claude.send('session:fork', {
        forkedFromChannelId: channelId,
        resumeSessionAt: 'msg-1',
        newChannelId: 'fork-verify',
      });
      await new Promise<void>((r) => setTimeout(r, 50));

      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      const forked = await sessionStore.getByChannelId('fork-verify');
      expect(forked).toBeDefined();
      expect(forked!.parentId).toBe(channelId);
      expect(forked!.parentId).not.toBe('fork-verify');
    });

    it('fork_conversation emits session:created exactly once', async () => {
      const { claude, channelId } = await setup();

      await claude.send('session:fork', {
        forkedFromChannelId: channelId,
        resumeSessionAt: 'msg-1',
        newChannelId: 'fork-once',
      });

      const forkCreated = claude
        .events('session:created')
        .filter((e: any) => e.channelId === 'fork-once');
      expect(forkCreated).toHaveLength(1);
    });

    it('session:created broadcast carries parent cwd (so client tab opens)', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const summoner = createFakeSummoner(server);

      const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
      await sessionStore.upsert({
        id: 'sess-fork-cwd',
        channelId: 'ch-fork-parent',
        provider: 'claude',
        command: 'claude',
        args: '[]',
        mode: 'interactive',
        role: 'chat',
        cwd: '/tmp/parent-with-cwd',
        createdAt: new Date().toISOString(),
      });

      const forkClaude = summoner.claude();
      forkClaude.prepareInit(s.init('__unused__'));

      await summoner.send('session:fork', {
        forkedFromChannelId: 'ch-fork-parent',
        newChannelId: 'ch-fork-broadcast',
      });

      const events = forkClaude
        .events('session:created')
        .filter((e: any) => e.channelId === 'ch-fork-broadcast');
      expect(events).toHaveLength(1);
      expect(events[0].cwd).toBe('/tmp/parent-with-cwd');
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
      { remoteChannelId: 'remote-123', newChannelId: 'client-teleport-1' },
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
      { remoteChannelId: 'remote-123', branch: 'feature/x', newChannelId: 'client-teleport-2' },
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
      remoteChannelId: 'remote-123',
      branch: 'feature/x',
      newChannelId: 'client-teleport-3',
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
    }>('session:teleport', { remoteChannelId: channelId, newChannelId: 'client-teleport-4' });

    expect(result.success).toBe(true);
    expect(result.events).toBeDefined();
    expect(result.events!.length).toBeGreaterThan(0);
  });
});

describe('session:fork argv + sessionId + clone (fix-fork-resume-sessionid)', () => {
  it('spawn argv contains --resume <parentSid> --fork-session --session-id <newUuid>', async () => {
    const container = createTestContainer();
    const server = createFakeServer(container);
    const summoner = createFakeSummoner(server);
    const claude = summoner.claude();
    const parentChannelId = await claude.initialize(s.init('sess-parent'));

    const forkClaude = summoner.claude();
    forkClaude.prepareInit(s.init('__unused__'));

    await summoner.send<{ success: boolean; channelId?: string; error?: string }>('session:fork', {
      forkedFromChannelId: parentChannelId,
      newChannelId: 'ch-fork-1',
    });

    const lastSpawn = forkClaude.provider.spawnCalls.at(-1);
    expect(lastSpawn).toBeDefined();
    const args = lastSpawn?.args ?? [];

    const resumeIdx = args.indexOf('--resume');
    expect(resumeIdx).toBeGreaterThanOrEqual(0);
    expect(args[resumeIdx + 1]).toBe('sess-parent');

    expect(args).toContain('--fork-session');

    const sidIdx = args.indexOf('--session-id');
    expect(sidIdx).toBeGreaterThanOrEqual(0);
    const newSid = args[sidIdx + 1];
    expect(newSid).toMatch(/^[0-9a-f-]{36}$/i);
    expect(newSid).not.toBe('sess-parent');
  });

  it('spawns with parent cwd recovered from sessionStore (dead parent channel)', async () => {
    const container = createTestContainer();
    const server = createFakeServer(container);
    const summoner = createFakeSummoner(server);

    const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
    await sessionStore.upsert({
      id: 'sess-cwd-parent',
      channelId: 'ch-dead-parent',
      provider: 'claude',
      command: 'claude',
      args: '[]',
      mode: 'interactive',
      role: 'chat',
      cwd: '/tmp/parent-proj',
      createdAt: new Date().toISOString(),
    });

    const forkClaude = summoner.claude();
    forkClaude.prepareInit(s.init('__unused__'));

    await summoner.send('session:fork', {
      forkedFromChannelId: 'ch-dead-parent',
      newChannelId: 'ch-fork-cwd',
    });

    const lastSpawn = forkClaude.provider.spawnCalls.at(-1);
    expect(lastSpawn?.options?.cwd).toBe('/tmp/parent-proj');

    const args = lastSpawn?.args ?? [];
    const resumeIdx = args.indexOf('--resume');
    expect(args[resumeIdx + 1]).toBe('sess-cwd-parent');
  });

  it('clones parent rawEventStore rows under the new sessionId', async () => {
    const container = createTestContainer();
    const server = createFakeServer(container);
    const summoner = createFakeSummoner(server);

    const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
    await sessionStore.upsert({
      id: 'sess-clone-parent',
      channelId: 'ch-clone-parent',
      provider: 'claude',
      command: 'claude',
      args: '[]',
      mode: 'interactive',
      role: 'chat',
      cwd: '/tmp',
      createdAt: new Date().toISOString(),
    });

    const rawStore = container.get<RawEventStore>(TYPES.RawEventStore);
    await rawStore.append({
      timestamp: Date.now(),
      sessionId: 'sess-clone-parent',
      promptId: 'p-A',
      direction: 'in',
      raw: 'raw-A',
      seq: 0,
    });
    await rawStore.append({
      timestamp: Date.now() + 1,
      sessionId: 'sess-clone-parent',
      promptId: 'p-B',
      direction: 'out',
      raw: 'raw-B',
      seq: 1,
    });

    const forkClaude = summoner.claude();
    forkClaude.prepareInit(s.init('__unused__'));

    await summoner.send('session:fork', {
      forkedFromChannelId: 'ch-clone-parent',
      newChannelId: 'ch-fork-clone',
    });

    const lastSpawn = forkClaude.provider.spawnCalls.at(-1);
    const args = lastSpawn?.args ?? [];
    const sidIdx = args.indexOf('--session-id');
    const newSid = args[sidIdx + 1];

    const cloned = await rawStore.getBySession(newSid);
    const rawValues = cloned.map((r) => r.raw);
    expect(rawValues).toContain('raw-A');
    expect(rawValues).toContain('raw-B');
    const aIdx = rawValues.indexOf('raw-A');
    const bIdx = rawValues.indexOf('raw-B');
    expect(aIdx).toBeLessThan(bIdx);
  });
});

describe('session:fork pass-through + reject + ack (fix-fork-resume-sessionid)', () => {
  it('forwards resumeSessionAt to CLI argv as --resume-session-at', async () => {
    const container = createTestContainer();
    const server = createFakeServer(container);
    const summoner = createFakeSummoner(server);

    const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
    await sessionStore.upsert({
      id: 'sess-at-parent',
      channelId: 'ch-at-parent',
      provider: 'claude',
      command: 'claude',
      args: '[]',
      mode: 'interactive',
      role: 'chat',
      cwd: '/tmp',
      createdAt: new Date().toISOString(),
    });

    const forkClaude = summoner.claude();
    forkClaude.prepareInit(s.init('__unused__'));

    await summoner.send('session:fork', {
      forkedFromChannelId: 'ch-at-parent',
      resumeSessionAt: 'msg-42',
      newChannelId: 'ch-fork-at',
    });

    const lastSpawn = forkClaude.provider.spawnCalls.at(-1);
    const args = lastSpawn?.args ?? [];
    const idx = args.indexOf('--resume-session-at');
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(args[idx + 1]).toBe('msg-42');
  });

  it('rejects when parent has live channel sessionId but no sessionStore row', async () => {
    // Case A: alive channel pre-set sessionId (e.g. fork mid-launch) but DB row
    // not yet persisted. Without a row we have no cwd, so CLI would silently fail
    // to find the JSONL. handleFork must reject early.
    const container = createTestContainer();
    const server = createFakeServer(container);
    const summoner = createFakeSummoner(server);
    const claude = summoner.claude();
    const parentChannelId = await claude.initialize(s.init('sess-no-row'));

    // Wipe the auto-created sessionStore row so resolveSessionId still hits the
    // live channel (returns 'sess-no-row') but getById returns null.
    const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
    await sessionStore.delete('sess-no-row');

    const forkClaude = summoner.claude();
    forkClaude.prepareInit(s.init('__never_used__'));
    const beforeSpawnCount = forkClaude.provider.spawnCalls.length;

    const result = await summoner.send<{ success: boolean; error?: string }>('session:fork', {
      forkedFromChannelId: parentChannelId,
      newChannelId: 'ch-fork-norow',
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/parent session not found/i);
    expect(forkClaude.provider.spawnCalls.length).toBe(beforeSpawnCount);
  });

  it('rejects unknown parent without spawning', async () => {
    const container = createTestContainer();
    const server = createFakeServer(container);
    const summoner = createFakeSummoner(server);

    const claudeForSpy = summoner.claude();
    claudeForSpy.prepareInit(s.init('__never_used__'));
    const beforeSpawnCount = claudeForSpy.provider.spawnCalls.length;

    const result = await summoner.send<{ success: boolean; error?: string }>('session:fork', {
      forkedFromChannelId: 'ch-missing',
      newChannelId: 'ch-fork-missing',
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/parent session not found/i);
    expect(claudeForSpy.provider.spawnCalls.length).toBe(beforeSpawnCount);
  });

  it('ack shape: success without events field', async () => {
    const container = createTestContainer();
    const server = createFakeServer(container);
    const summoner = createFakeSummoner(server);

    const sessionStore = container.get<SessionStore>(TYPES.SessionStore);
    await sessionStore.upsert({
      id: 'sess-ack-parent',
      channelId: 'ch-ack-parent',
      provider: 'claude',
      command: 'claude',
      args: '[]',
      mode: 'interactive',
      role: 'chat',
      cwd: '/tmp',
      createdAt: new Date().toISOString(),
    });

    const forkClaude = summoner.claude();
    forkClaude.prepareInit(s.init('__unused__'));

    const result = await summoner.send<{
      success: boolean;
      channelId?: string;
      parentChannelId?: string;
      events?: ClientMessage[];
    }>('session:fork', {
      forkedFromChannelId: 'ch-ack-parent',
      newChannelId: 'ch-fork-ack',
    });

    expect(result.success).toBe(true);
    expect(result.channelId).toBe('ch-fork-ack');
    expect(result.parentChannelId).toBe('ch-ack-parent');
    expect(result.events).toBeUndefined();
  });
});

describe('chat:fork enhanced', () => {
  it('should store parentId on forked session in session store', async () => {
    const { claude, channelId } = await setup();

    const forkResult = await claude.send<{
      success: boolean;
      channelId?: string;
      parentChannelId?: string;
      error?: string;
    }>('session:fork', {
      forkedFromChannelId: channelId,
      resumeSessionAt: 'msg-1',
      newChannelId: 'client-fork-1',
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

  it('should include parentChannelId in fork response', async () => {
    const { claude, channelId } = await setup();

    const forkResult = await claude.send<{
      success: boolean;
      channelId?: string;
      parentChannelId?: string;
      error?: string;
    }>('session:fork', {
      forkedFromChannelId: channelId,
      resumeSessionAt: 'msg-1',
      newChannelId: 'client-fork-2',
    });

    expect(forkResult.success).toBe(true);
    expect(forkResult.parentChannelId).toBe(channelId);
  });
});
