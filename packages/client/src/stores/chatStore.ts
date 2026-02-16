import type { ChatProvider, ChatStats, ChatStreamEvent } from '@code-quest/shared';
import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface PendingPermission {
  toolName: string;
  description: string;
}

export interface QuestionOption {
  label: string;
  description?: string;
}

export interface AskUserQuestionData {
  question: string;
  header?: string;
  options: QuestionOption[];
  multiSelect?: boolean;
}

export interface PendingQuestion {
  questions: AskUserQuestionData[];
}

interface ChatSessionState {
  provider: ChatProvider;
  messages: ChatMessage[];
  isProcessing: boolean;
  pendingPermission?: PendingPermission;
  pendingQuestion?: PendingQuestion;
  allowedTools: string[];
  /** tool_use names that have not yet received a matching tool_result */
  unresolvedToolUses: string[];
  /** Captured AskUserQuestion input during streaming, consumed at result time */
  _capturedAskQuestion?: AskUserQuestionData[];
  worktreePath?: string;
  worktreeBranch?: string;
}

interface ChatStore {
  chatSessions: Map<string, ChatSessionState>;

  initChatSession: (sessionId: string, provider: ChatProvider) => void;
  removeChatSession: (sessionId: string) => void;
  getChatSession: (sessionId: string) => ChatSessionState | undefined;
  addUserMessage: (sessionId: string, content: string) => void;
  handleChatEvent: (sessionId: string, event: ChatStreamEvent) => void;
  allowTool: (sessionId: string, toolName: string) => void;
  clearPendingPermission: (sessionId: string) => void;
  clearPendingQuestion: (sessionId: string) => void;
  setWorktreeInfo: (sessionId: string, worktreePath: string, worktreeBranch: string) => void;
  clearWorktreeInfo: (sessionId: string) => void;
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
        allowedTools: [],
        unresolvedToolUses: [],
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
      let pendingQuestion = session.pendingQuestion;
      let unresolvedToolUses = [...session.unresolvedToolUses];
      let _capturedAskQuestion = session._capturedAskQuestion;

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
          msg.toolUse = [
            ...(msg.toolUse ?? []),
            { id: event.data.id, name: event.data.name, input: event.data.input },
          ];
          if (isAssistant) {
            messages[messages.length - 1] = msg;
          } else {
            messages.push(msg);
          }
          // Track: will be resolved by a matching tool_result, or flagged as denied at result time
          unresolvedToolUses.push(event.data.name);
          // Capture AskUserQuestion data immediately — don't rely on unresolvedToolUses
          // because CLI auto-deny may produce a tool_result that clears it before result arrives
          if (event.data.name === 'AskUserQuestion') {
            const input = event.data.input as { questions?: AskUserQuestionData[] };
            if (input.questions) {
              _capturedAskQuestion = input.questions;
            }
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
          // Resolve: this tool executed successfully, remove first matching unresolved
          const idx = unresolvedToolUses.indexOf(event.data.name);
          if (idx !== -1) {
            unresolvedToolUses.splice(idx, 1);
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

          // Check for captured AskUserQuestion data (independent of unresolvedToolUses,
          // because CLI auto-deny may produce a tool_result that clears unresolvedToolUses)
          if (_capturedAskQuestion) {
            pendingQuestion = { questions: _capturedAskQuestion };
            _capturedAskQuestion = undefined;
            // Remove AskUserQuestion from unresolvedToolUses if still present
            const askIdx = unresolvedToolUses.indexOf('AskUserQuestion');
            if (askIdx !== -1) {
              unresolvedToolUses.splice(askIdx, 1);
            }
          }

          // Check for denied tools: tool_use without matching tool_result, and not already allowed
          const deniedTool = unresolvedToolUses.find((t) => !session.allowedTools.includes(t));
          if (deniedTool) {
            // Find the tool_use input for description
            const allToolUses2 = messages.flatMap((m) => m.toolUse ?? []);
            const toolEntry = allToolUses2.find((t) => t.name === deniedTool);
            pendingPermission = {
              toolName: deniedTool,
              description: toolEntry ? JSON.stringify(toolEntry.input).slice(0, 100) : '',
            };
          } else {
            pendingPermission = undefined;
          }
          unresolvedToolUses = [];
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
        pendingQuestion,
        unresolvedToolUses,
        _capturedAskQuestion,
      });

      return { chatSessions };
    });
  },

  allowTool: (sessionId: string, toolName: string) => {
    set((state) => {
      const chatSessions = new Map(state.chatSessions);
      const session = chatSessions.get(sessionId);
      if (!session) return state;

      chatSessions.set(sessionId, {
        ...session,
        allowedTools: session.allowedTools.includes(toolName)
          ? session.allowedTools
          : [...session.allowedTools, toolName],
        pendingPermission: undefined,
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

  clearPendingQuestion: (sessionId: string) => {
    set((state) => {
      const chatSessions = new Map(state.chatSessions);
      const session = chatSessions.get(sessionId);
      if (!session) return state;

      chatSessions.set(sessionId, {
        ...session,
        pendingQuestion: undefined,
      });
      return { chatSessions };
    });
  },

  setWorktreeInfo: (sessionId: string, worktreePath: string, worktreeBranch: string) => {
    set((state) => {
      const chatSessions = new Map(state.chatSessions);
      const session = chatSessions.get(sessionId);
      if (!session) return state;

      chatSessions.set(sessionId, {
        ...session,
        worktreePath,
        worktreeBranch,
      });
      return { chatSessions };
    });
  },

  clearWorktreeInfo: (sessionId: string) => {
    set((state) => {
      const chatSessions = new Map(state.chatSessions);
      const session = chatSessions.get(sessionId);
      if (!session) return state;

      chatSessions.set(sessionId, {
        ...session,
        worktreePath: undefined,
        worktreeBranch: undefined,
      });
      return { chatSessions };
    });
  },
}));
