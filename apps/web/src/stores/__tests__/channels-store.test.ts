import { beforeEach, describe, expect, it } from 'vitest';
import { initialChannelState } from '@/types/chat';
import { useChannelsStore } from '../channels-store.ts';

describe('useChannelsStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useChannelsStore.setState({ channels: new Map() });
  });

  it('starts with empty channels map', () => {
    expect(useChannelsStore.getState().channels.size).toBe(0);
  });

  it('setChannelState creates a new channel entry', () => {
    const { setChannelState } = useChannelsStore.getState();
    setChannelState('ch-1', () => initialChannelState('ch-1'));

    const ch = useChannelsStore.getState().channels.get('ch-1');
    expect(ch).toBeDefined();
    expect(ch?.channelId).toBe('ch-1');
    expect(ch?.messages).toEqual([]);
    expect(ch?.tasks.size).toBe(0);
  });

  it('setChannelState updates existing channel', () => {
    const { setChannelState } = useChannelsStore.getState();
    setChannelState('ch-1', () => initialChannelState('ch-1'));
    setChannelState('ch-1', (prev) => ({
      ...prev,
      messages: [{ id: 'msg1', type: 'text', content: 'hi' } as never],
    }));

    const ch = useChannelsStore.getState().channels.get('ch-1');
    expect(ch?.messages).toHaveLength(1);
  });

  it('removeChannel deletes channel from map', () => {
    const { setChannelState, removeChannel } = useChannelsStore.getState();
    setChannelState('ch-1', () => initialChannelState('ch-1'));
    setChannelState('ch-2', () => initialChannelState('ch-2'));

    removeChannel('ch-1');

    expect(useChannelsStore.getState().channels.has('ch-1')).toBe(false);
    expect(useChannelsStore.getState().channels.has('ch-2')).toBe(true);
  });

  it('multiple channels are independent', () => {
    const { setChannelState } = useChannelsStore.getState();
    setChannelState('ch-1', () => initialChannelState('ch-1'));
    setChannelState('ch-2', () => initialChannelState('ch-2'));

    setChannelState('ch-1', (prev) => ({ ...prev, status: 'processing' as const }));

    expect(useChannelsStore.getState().channels.get('ch-1')?.status).toBe('processing');
    expect(useChannelsStore.getState().channels.get('ch-2')?.status).toBe('idle');
  });

  it('selector for per-channel messages', () => {
    const { setChannelState } = useChannelsStore.getState();
    setChannelState('ch-1', () => ({
      ...initialChannelState('ch-1'),
      messages: [{ id: 'msg1' } as never],
    }));

    const selector = (s: ReturnType<typeof useChannelsStore.getState>) =>
      s.channels.get('ch-1')?.messages;
    expect(selector(useChannelsStore.getState())).toHaveLength(1);
  });

  it('global iteration for search', () => {
    const { setChannelState } = useChannelsStore.getState();
    setChannelState('ch-1', () => ({
      ...initialChannelState('ch-1'),
      messages: [{ id: 'a', content: 'hello' } as never],
    }));
    setChannelState('ch-2', () => ({
      ...initialChannelState('ch-2'),
      messages: [{ id: 'b', content: 'world' } as never],
    }));

    const { channels } = useChannelsStore.getState();
    const all: Array<{ channelId: string; msgId: string }> = [];
    for (const [id, ch] of channels) {
      for (const msg of ch.messages) {
        all.push({ channelId: id, msgId: (msg as { id: string }).id });
      }
    }
    expect(all).toHaveLength(2);
    expect(all[0]?.channelId).toBe('ch-1');
    expect(all[1]?.channelId).toBe('ch-2');
  });
});
