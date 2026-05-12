import { create } from 'zustand';
import type { ChannelState } from '@/types/chat';
import { initialChannelState } from '@/types/chat';

interface ChannelsStoreState {
  channels: Map<string, ChannelState>;
  setChannelState: (channelId: string, fn: (prev: ChannelState) => ChannelState) => void;
  removeChannel: (channelId: string) => void;
}

export const useChannelsStore: import('zustand').UseBoundStore<
  import('zustand').StoreApi<ChannelsStoreState>
> = create<ChannelsStoreState>((set) => ({
  channels: new Map(),

  setChannelState(channelId, fn) {
    set((state) => {
      const prev = state.channels.get(channelId) ?? initialChannelState(channelId);
      const next = fn(prev);
      if (next === prev) return state;
      const channels = new Map(state.channels);
      channels.set(channelId, next);
      return { channels };
    });
  },

  removeChannel(channelId) {
    set((state) => {
      const channels = new Map(state.channels);
      channels.delete(channelId);
      return { channels };
    });
  },
}));
