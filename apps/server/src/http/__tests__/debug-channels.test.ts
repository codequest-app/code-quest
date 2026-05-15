import { describe, expect, it } from 'vitest';
import type { ChannelManager } from '../../socket/channel-manager.ts';
import { buildChannelsSnapshot } from '../debug-channels.ts';

function makeChannelStub(overrides: {
  channelId: string;
  sessionId?: string | null;
  exited?: boolean;
  isBound?: boolean;
  isProcessing?: boolean;
  cwd?: string;
  projectRoot?: string | null;
}) {
  return {
    channelId: overrides.channelId,
    sessionId: overrides.sessionId ?? null,
    exited: overrides.exited ?? false,
    isBound: overrides.isBound ?? true,
    isProcessing: overrides.isProcessing ?? false,
    cwd: overrides.cwd ?? '/project',
    projectRoot: overrides.projectRoot ?? null,
  };
}

function makeChannelManager(
  channels: ReturnType<typeof makeChannelStub>[],
): Pick<ChannelManager, 'getAliveChannels'> {
  return {
    getAliveChannels: () => channels.map((ch) => [ch.channelId, ch] as [string, typeof ch]),
  } as unknown as Pick<ChannelManager, 'getAliveChannels'>;
}

describe('buildChannelsSnapshot', () => {
  it('returns empty array when no channels', () => {
    const manager = makeChannelManager([]);
    expect(buildChannelsSnapshot(manager as unknown as ChannelManager)).toEqual({ channels: [] });
  });

  it('includes all fields for each alive channel', () => {
    const ch = makeChannelStub({
      channelId: 'ch-1',
      sessionId: 'sess-abc',
      exited: false,
      isBound: true,
      isProcessing: true,
      cwd: '/home/user/project',
      projectRoot: '/home/user/project',
    });
    const manager = makeChannelManager([ch]);
    const { channels } = buildChannelsSnapshot(manager as unknown as ChannelManager);

    expect(channels).toHaveLength(1);
    expect(channels[0]).toEqual({
      channelId: 'ch-1',
      sessionId: 'sess-abc',
      exited: false,
      isBound: true,
      isProcessing: true,
      cwd: '/home/user/project',
      projectRoot: '/home/user/project',
    });
  });

  it('exposes null projectRoot when channel has none', () => {
    const ch = makeChannelStub({ channelId: 'ch-2', projectRoot: null });
    const manager = makeChannelManager([ch]);
    const { channels } = buildChannelsSnapshot(manager as unknown as ChannelManager);

    expect(channels[0]?.projectRoot).toBeNull();
  });

  it('returns only alive channels (exited=false)', () => {
    const manager = makeChannelManager([makeChannelStub({ channelId: 'alive', exited: false })]);
    const { channels } = buildChannelsSnapshot(manager as unknown as ChannelManager);
    expect(channels).toHaveLength(1);
    expect(channels[0]?.channelId).toBe('alive');
  });
});
