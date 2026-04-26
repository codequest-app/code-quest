import { create } from 'zustand';
import type { Message } from '../types/ui';

interface ChannelEntry {
  projectCwd: string;
  messages: Message[];
}

export interface RegistryMessage {
  channelId: string;
  projectCwd: string;
  message: Message;
}

interface MessageRegistryState {
  channels: Map<string, ChannelEntry>;
  register(channelId: string, entry: ChannelEntry): void;
  update(channelId: string, messages: Message[]): void;
  unregister(channelId: string): void;
  getAllMessages(): RegistryMessage[];
}

export const useMessageRegistryStore = create<MessageRegistryState>((set, get) => ({
  channels: new Map(),

  register(channelId, entry) {
    set((state) => {
      const next = new Map(state.channels);
      next.set(channelId, entry);
      return { channels: next };
    });
  },

  update(channelId, messages) {
    set((state) => {
      const existing = state.channels.get(channelId);
      if (!existing) return state;
      const next = new Map(state.channels);
      next.set(channelId, { ...existing, messages });
      return { channels: next };
    });
  },

  unregister(channelId) {
    set((state) => {
      const next = new Map(state.channels);
      next.delete(channelId);
      return { channels: next };
    });
  },

  getAllMessages() {
    const result: RegistryMessage[] = [];
    for (const [channelId, entry] of get().channels) {
      for (const message of entry.messages) {
        result.push({ channelId, projectCwd: entry.projectCwd, message });
      }
    }
    return result;
  },
}));
