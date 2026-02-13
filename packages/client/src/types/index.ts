/**
 * Client-side types
 */

import type { ChatStats } from '@code-quest/shared';

export type SessionType = 'terminal' | 'claude-chat' | 'gemini-chat' | 'orchestrator';

/**
 * Terminal session state
 */
export interface TerminalSession {
  id: string;
  pid: number;
  type: SessionType;
  isActive: boolean;
  createdAt: number;
}

/**
 * Socket connection state
 */
export interface SocketState {
  connected: boolean;
  error: string | null;
}

/**
 * Terminal store state
 */
export interface TerminalStore {
  sessions: Map<string, TerminalSession>;
  activeSessionId: string | null;
  socketState: SocketState;
  serializedStates: Map<string, string>;
  pendingData: Map<string, string[]>;

  // Actions
  addSession: (id: string, pid: number, type?: SessionType) => void;
  removeSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  setSocketConnected: (connected: boolean) => void;
  setSocketError: (error: string | null) => void;
  getSession: (id: string) => TerminalSession | undefined;
  getActiveSession: () => TerminalSession | undefined;
  getSessions: () => TerminalSession[];
  setSerializedState: (id: string, state: string) => void;
  getSerializedState: (id: string) => string | undefined;
  appendPendingData: (id: string, data: string) => void;
  consumePendingData: (id: string) => string[];
}

export type ChatMessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  thinking?: string;
  toolUse?: Array<{ id: string; name: string; input: unknown }>;
  toolResult?: Array<{ name: string; output: string }>;
  stats?: ChatStats;
  isStreaming?: boolean;
}
