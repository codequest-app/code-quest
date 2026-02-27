import type { ChatStats } from '@code-quest/shared';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Message, SessionStatus } from '../types/ui';

export interface PendingControl {
  requestId: string;
  subtype: string;
  toolName?: string;
  input?: unknown;
}

interface ChatState {
  sessionId: string | null;
  status: SessionStatus;
  messages: Message[];
  pendingControl: PendingControl | null;
  stats: ChatStats | null;

  setSessionId: (id: string | null) => void;
  setStatus: (status: SessionStatus) => void;
  addMessage: (msg: Message) => void;
  appendToLastMessage: (content: string) => void;
  clearMessages: () => void;
  setPendingControl: (ctrl: PendingControl | null) => void;
  setStats: (stats: ChatStats | null) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set) => ({
      sessionId: null,
      status: 'disconnected',
      messages: [],
      pendingControl: null,
      stats: null,

      setSessionId: (id) => set({ sessionId: id }),
      setStatus: (status) => set({ status }),
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      appendToLastMessage: (content) =>
        set((s) => {
          if (s.messages.length === 0) return s;
          const msgs = [...s.messages];
          const last = {
            ...msgs[msgs.length - 1],
            content: msgs[msgs.length - 1].content + content,
          };
          msgs[msgs.length - 1] = last;
          return { messages: msgs };
        }),
      clearMessages: () => set({ messages: [] }),
      setPendingControl: (ctrl) => set({ pendingControl: ctrl }),
      setStats: (stats) => set({ stats }),
    }),
    { name: 'ChatStore' },
  ),
);
