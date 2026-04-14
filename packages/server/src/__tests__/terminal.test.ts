import type { RpcResult } from '@code-quest/shared';
import { segments as s } from '@code-quest/summoner/test';
import { createFakeServer, createFakeSummoner, createTestContainer } from '../test/index.ts';
import { TYPES } from '../types.ts';

type TerminalOpenClaudeRpc = RpcResult<{ channelId: string }>;
type TerminalOpenClaudeOk = Extract<TerminalOpenClaudeRpc, { ok: true }>;

async function setup(sessionId = 'cli-sess') {
  const container = createTestContainer();
  const server = createFakeServer(container);
  const summoner = createFakeSummoner(server);
  const claude = summoner.claude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { container, claude, channelId };
}

describe('ChatHandler > terminal', () => {
  describe('terminal:read', () => {
    it('returns { content: null } when no terminal lines exist', async () => {
      const { claude, channelId } = await setup();

      const res = await claude.send<{ content: string | null }>('terminal:read', {
        channelId,
      });

      expect(res.content).toBeNull();
    });

    it('returns last 100 lines joined by \\n when session has lines', async () => {
      const { container, claude, channelId } = await setup();

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      const channel = mgr.get(channelId)!;
      channel.terminalLines = ['line1', 'line2', 'line3'];

      const res = await claude.send<{ content: string | null }>('terminal:read', {
        channelId,
      });

      expect(res.content).toBe('line1\nline2\nline3');
    });

    it('returns only last 100 lines when there are more than 100', async () => {
      const { container, claude, channelId } = await setup();

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      const channel = mgr.get(channelId)!;
      channel.terminalLines = Array.from({ length: 150 }, (_, i) => `line${i + 1}`);

      const res = await claude.send<{ content: string | null }>('terminal:read', {
        channelId,
      });

      expect(res.content).not.toBeNull();
      const lines = res.content!.split('\n');
      expect(lines).toHaveLength(100);
      expect(lines[0]).toBe('line51');
      expect(lines[99]).toBe('line150');
    });
  });

  describe('terminal:open_claude', () => {
    it('creates a new session and returns { success: true, channelId }', async () => {
      const { container, claude, channelId } = await setup();

      const res = (await claude.send<TerminalOpenClaudeRpc>('terminal:open_claude', {
        channelId,
      })) as TerminalOpenClaudeOk;

      expect(res.ok).toBe(true);
      expect(res.data.channelId).toBeDefined();

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      expect(mgr.get(res.data.channelId)).toBeDefined();
    });

    it('with a prompt, sends message to the spawned session', async () => {
      const { claude, channelId } = await setup();

      const res = (await claude.send<TerminalOpenClaudeRpc>('terminal:open_claude', {
        channelId,
        prompt: 'hello',
      })) as TerminalOpenClaudeOk;

      expect(res.ok).toBe(true);
      expect(res.data.channelId).toBeDefined();
    });

    it('with a cwd, the new channel uses that cwd', async () => {
      const { container, claude, channelId } = await setup();

      const res = (await claude.send<TerminalOpenClaudeRpc>('terminal:open_claude', {
        channelId,
        cwd: '/tmp',
      })) as TerminalOpenClaudeOk;

      expect(res.ok).toBe(true);

      const { ChannelManager } = await import('../socket/channel-manager.ts');
      const mgr = container.get(TYPES.ChannelManager) as InstanceType<typeof ChannelManager>;
      const newChannel = mgr.get(res.data.channelId);
      expect(newChannel?.cwd).toBe('/tmp');
    });

    it('with a cwd, the spawned CLI process uses that cwd', async () => {
      const { claude, channelId } = await setup();
      const spawnCountBefore = claude.provider.spawnCalls.length;

      await claude.send<TerminalOpenClaudeRpc>('terminal:open_claude', {
        channelId,
        cwd: '/tmp',
      });

      const lastSpawn = claude.provider.spawnCalls[spawnCountBefore];
      expect(lastSpawn.options?.cwd).toBe('/tmp');
    });
  });
});
