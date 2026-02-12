import { create } from 'zustand';
import type { ChatMessage, ChatProvider, ChatStats, ChatStreamEvent } from '../types';

interface PendingPermission {
  toolName: string;
  description: string;
}

interface ChatSessionState {
  provider: ChatProvider;
  messages: ChatMessage[];
  isProcessing: boolean;
  pendingPermission?: PendingPermission;
}

interface ChatStore {
  chatSessions: Map<string, ChatSessionState>;

  initChatSession: (sessionId: string, provider: ChatProvider) => void;
  removeChatSession: (sessionId: string) => void;
  getChatSession: (sessionId: string) => ChatSessionState | undefined;
  addUserMessage: (sessionId: string, content: string) => void;
  handleChatEvent: (sessionId: string, event: ChatStreamEvent) => void;
  clearPendingPermission: (sessionId: string) => void;
}

let messageCounter = 0;

function createMessageId(): string {
  return `msg-${++messageCounter}`;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chatSessions: new Map(),

  initChatSession: (sessionId: string, provider: ChatProvider) => {
    set((state) => {
      const chatSessions = new Map(state.chatSessions);
      chatSessions.set(sessionId, {
        provider,
        messages: [],
        isProcessing: false,
      });
      return { chatSessions };
    });
  },

  removeChatSession: (sessionId: string) => {
    set((state) => {
      const chatSessions = new Map(state.chatSessions);
      chatSessions.delete(sessionId);
      return { chatSessions };
    });
  },

  getChatSession: (sessionId: string) => {
    return get().chatSessions.get(sessionId);
  },

  addUserMessage: (sessionId: string, content: string) => {
    set((state) => {
      const chatSessions = new Map(state.chatSessions);
      const session = chatSessions.get(sessionId);
      if (!session) return state;

      chatSessions.set(sessionId, {
        ...session,
        messages: [
          ...session.messages,
          {
            id: createMessageId(),
            role: 'user',
            content,
          },
        ],
        isProcessing: true,
      });
      return { chatSessions };
    });
  },

  handleChatEvent: (sessionId: string, event: ChatStreamEvent) => {
    set((state) => {
      const chatSessions = new Map(state.chatSessions);
      const session = chatSessions.get(sessionId);
      if (!session) return state;

      const messages = [...session.messages];
      let isProcessing = session.isProcessing;
      let pendingPermission = session.pendingPermission;

      // Get or create the current assistant message
      const lastMsg = messages[messages.length - 1];
      const isAssistant = lastMsg?.role === 'assistant' && lastMsg?.isStreaming;

      const getOrCreateAssistant = (): ChatMessage => {
        if (isAssistant) {
          return { ...lastMsg };
        }
        return {
          id: createMessageId(),
          role: 'assistant',
          content: '',
          isStreaming: true,
        };
      };

      switch (event.type) {
        case 'text': {
          const msg = getOrCreateAssistant();
          msg.content += event.data.content;
          if (isAssistant) {
            messages[messages.length - 1] = msg;
          } else {
            messages.push(msg);
          }
          break;
        }

        case 'thinking': {
          const msg = getOrCreateAssistant();
          msg.thinking = (msg.thinking ?? '') + event.data.content;
          if (isAssistant) {
            messages[messages.length - 1] = msg;
          } else {
            messages.push(msg);
          }
          break;
        }

        case 'tool_use': {
          const msg = getOrCreateAssistant();
          msg.toolUse = [...(msg.toolUse ?? []), { name: event.data.name, input: event.data.input }];
          if (isAssistant) {
            messages[messages.length - 1] = msg;
          } else {
            messages.push(msg);
          }
          break;
        }

        case 'tool_result': {
          const msg = getOrCreateAssistant();
          msg.toolResult = [
            ...(msg.toolResult ?? []),
            { name: event.data.name, output: event.data.output },
          ];
          if (isAssistant) {
            messages[messages.length - 1] = msg;
          } else {
            messages.push(msg);
          }
          break;
        }

        case 'result': {
          if (isAssistant) {
            const msg = { ...lastMsg };
            msg.isStreaming = false;
            msg.stats = (event.data as { stats: ChatStats }).stats;
            messages[messages.length - 1] = msg;
          }
          isProcessing = false;
          pendingPermission = undefined;
          break;
        }

        case 'permission_request': {
          pendingPermission = {
            toolName: event.data.toolName,
            description: event.data.description,
          };
          break;
        }

        default:
          break;
      }

      chatSessions.set(sessionId, {
        ...session,
        messages,
        isProcessing,
        pendingPermission,
      });

      return { chatSessions };
    });
  },

  clearPendingPermission: (sessionId: string) => {
    set((state) => {
      const chatSessions = new Map(state.chatSessions);
      const session = chatSessions.get(sessionId);
      if (!session) return state;

      chatSessions.set(sessionId, {
        ...session,
        pendingPermission: undefined,
      });
      return { chatSessions };
    });
  },
}));
