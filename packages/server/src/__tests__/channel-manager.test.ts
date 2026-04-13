/* biome-ignore-all lint/suspicious/noExplicitAny: test file */
import { segments as s } from '@code-quest/summoner/test';
import { createFakeServer, createFakeSummoner, createTestContainer } from '../test/index.ts';
import { TYPES } from '../types.ts';

async function setup(sessionId = 'test-session-001') {
  const container = createTestContainer();
  const server = createFakeServer(container);
  const summoner = createFakeSummoner(server);
  const claude = summoner.claude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { container, claude, channelId };
}

describe('ChannelManager', () => {
  describe('create', () => {
    it('spawns runner, initializes, and stores channel', async () => {
      const { channelId } = await setup();
      // Channel exists — init event was received
      expect(channelId).toBeTruthy();
    });

    it('creates multiple channels', async () => {
      const claude = createFakeSummoner().claude();

      const ch1 = await claude.initialize({ launch: { channelId: 'ch-1' } });
      const ch2 = await claude.initialize({ launch: { channelId: 'ch-2' } });

      expect(ch1).toBe('ch-1');
      expect(ch2).toBe('ch-2');
    });
  });

  describe('join', () => {
    it('returns channel and events for existing channel', async () => {
      const { claude, channelId } = await setup();

      const joinResult = await claude.send('session:join', { channelId });

      expect((joinResult as any).channelId).toBe(channelId);
      expect((joinResult as any).error).toBeUndefined();
    });

    it('returns error for unknown channel', async () => {
      const { claude } = await setup();

      const joinResult = await claude.send('session:join', { channelId: 'nonexistent' });

      expect((joinResult as any).error).toBeDefined();
    });
  });

  describe('destroy', () => {
    it('removes channel after destroy', async () => {
      const { claude, channelId } = await setup();

      await claude.send('session:close', { channelId });

      expect(claude.handle.signal.aborted).toBe(true);
    });

    it('session:closed fires after destroy', async () => {
      const { claude } = await setup();

      claude.handle.abort();
      await new Promise<void>((r) => queueMicrotask(r));

      expect(claude.events('session:closed').length).toBeGreaterThan(0);
    });
  });

  describe('getAllChannelIds', () => {
    it('session:states includes active channels', async () => {
      const claude = createFakeSummoner().claude();

      await claude.initialize({ launch: { channelId: 'ch-1' } });

      const statesEvents = claude.events('session:states');
      expect(statesEvents.length).toBeGreaterThan(0);
      expect(statesEvents[0].sessions).toBeDefined();
    });
  });

  describe('findByRequestId', () => {
    it('finds channel with pending control request', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'go' });
      await claude.emit(s.assistant({ toolUse: { id: 'toolu_1', name: 'Read', input: {} } }));
      await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Read', {}));

      const permEvents = claude.events('control:permission');
      expect(permEvents.length).toBeGreaterThan(0);
      expect(permEvents[0].requestId).toBe('req-1');
    });
  });

  describe('raw event recording', () => {
    it('records stdin and stdout events', async () => {
      const { claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'hello' });

      // User message was sent to Claude
      expect(claude.received('user').length).toBeGreaterThan(0);
    });
  });

  describe('session state broadcasting', () => {
    it('broadcasts session:states on state change', async () => {
      const claude = createFakeSummoner().claude();

      await claude.initialize({ launch: { channelId: 'ch-1' } });

      const statesEvents = claude.events('session:states');
      expect(statesEvents.length).toBeGreaterThan(0);
      const sessions = statesEvents[0].sessions;
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('session:states includes cwd', async () => {
      const claude = createFakeSummoner().claude();

      await claude.initialize({ launch: { channelId: 'ch-1', cwd: '/test/project' } });

      const statesEvents = claude.events('session:states');
      expect(statesEvents.length).toBeGreaterThan(0);
      expect(statesEvents[0].sessions[0].cwd).toBe('/test/project');
    });
  });

  describe('getAliveSessionIds', () => {
    it('returns sessionIds of non-exited channels that have a sessionId', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const summoner = createFakeSummoner(server);
      await summoner.claude().initialize(s.init('sess-alive'));

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.getAliveSessionIds()).toContain('sess-alive');
    });

    it('excludes sessionIds of exited channels', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const claude = createFakeSummoner(server).claude();
      await claude.initialize(s.init('sess-zombie'));
      claude.handle.abort();
      await new Promise<void>((r) => queueMicrotask(r));

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.getAliveSessionIds()).not.toContain('sess-zombie');
    });
  });

  describe('findAliveBySessionId', () => {
    it('returns the alive channel whose sessionId matches', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const claude = createFakeSummoner(server).claude();
      await claude.initialize(s.init('sess-target'));

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      const found = mgr.findAliveBySessionId('sess-target');

      expect(found).toBeDefined();
      expect(found?.sessionId).toBe('sess-target');
    });

    it('returns undefined when no alive channel matches', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      await createFakeSummoner(server).claude().initialize(s.init('sess-other'));

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.findAliveBySessionId('sess-missing')).toBeUndefined();
    });

    it('ignores exited channels', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const claude = createFakeSummoner(server).claude();
      await claude.initialize(s.init('sess-zombie'));
      claude.handle.abort();
      await new Promise<void>((r) => queueMicrotask(r));

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.findAliveBySessionId('sess-zombie')).toBeUndefined();
    });
  });

  describe('alive channels', () => {
    it('getAliveChannels includes launched channels', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const claude = createFakeSummoner(server).claude();
      await claude.initialize({ launch: { channelId: 'ch-alive' } });

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      const alive = mgr.getAllChannelIds();
      expect(alive).toContain('ch-alive');
    });

    it('excludes exited channels from alive list', async () => {
      const container = createTestContainer();
      const server = createFakeServer(container);
      const claude = createFakeSummoner(server).claude();
      const channelId = await claude.initialize({ launch: { channelId: 'ch-exit' } });

      claude.handle.abort();
      await new Promise<void>((r) => queueMicrotask(r));

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      const channel = mgr.get(channelId);
      expect(channel?.exited).toBe(true);
    });
  });

  describe('raw event persistence', () => {
    it('persists raw entries to rawEventStore', async () => {
      const { container, claude, channelId } = await setup();

      await claude.send('chat:send', { channelId, message: 'persist-test' });
      await claude.emit(s.assistant('reply'));
      await claude.emit(s.result());

      const rawEventStore = container.get(TYPES.RawEventStore) as any;
      const entries = await rawEventStore.getBySession('test-session-001');
      expect(entries.length).toBeGreaterThan(0);
    });
  });
});
