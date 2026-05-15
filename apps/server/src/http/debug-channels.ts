import type { ChannelManager } from '../socket/channel-manager.ts';

interface ChannelSnapshot {
  channelId: string;
  sessionId: string | null;
  exited: boolean;
  isBound: boolean;
  isProcessing: boolean;
  cwd: string;
  projectRoot: string | null;
}

export function buildChannelsSnapshot(channelManager: ChannelManager): {
  channels: ChannelSnapshot[];
} {
  return {
    channels: channelManager.getAliveChannels().map(([, ch]) => ({
      channelId: ch.channelId,
      sessionId: ch.sessionId,
      exited: ch.exited,
      isBound: ch.isBound,
      isProcessing: ch.isProcessing,
      cwd: ch.cwd,
      projectRoot: ch.projectRoot ?? null,
    })),
  };
}
