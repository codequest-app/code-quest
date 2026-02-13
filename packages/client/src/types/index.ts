/**
 * Client-side types
 */

export type SessionType = 'terminal' | 'claude-chat' | 'gemini-chat' | 'orchestrator';

export type ChatProvider = 'claude' | 'gemini';

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

/**
 * Chat stream event types (mirrors server)
 */
export type ChatStreamEvent =
  | { type: 'init'; data: { sessionId: string } }
  | { type: 'text'; data: { content: string } }
  | { type: 'thinking'; data: { content: string } }
  | { type: 'tool_use'; data: { id: string; name: string; input: unknown } }
  | { type: 'tool_result'; data: { name: string; output: string } }
  | { type: 'result'; data: { stats: ChatStats } }
  | { type: 'error'; data: { message: string } };

export interface ChatStats {
  costUsd?: number;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export type OrchestratorStatus =
  | 'idle'
  | 'dispatching'
  | 'workers-running'
  | 'workers-complete'
  | 'synthesizing'
  | 'complete'
  | 'error';

export interface SubTask {
  description: string;
  provider: ChatProvider;
}

export interface WorkerInfo {
  id: string;
  task: SubTask;
  status: 'pending' | 'running' | 'complete' | 'error';
  result?: string;
  stats?: ChatStats;
  error?: string;
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

/**
 * Socket.io events from server
 */
export interface ServerToClientEvents {
  'terminal:created': (sessionId: string, pid: number) => void;
  'terminal:data': (sessionId: string, data: string) => void;
  'terminal:exit': (sessionId: string, exitCode: number) => void;
  'terminal:list': (sessionIds: string[]) => void;
  'terminal:error': (message: string) => void;
  'chat:created': (sessionId: string, provider: string) => void;
  'chat:event': (sessionId: string, event: ChatStreamEvent) => void;
  'chat:complete': (sessionId: string, stats: ChatStats) => void;
  'chat:error': (sessionId: string, message: string) => void;
  'chat:exit': (sessionId: string) => void;
  'orchestrator:created': (orchId: string, coordinatorId: string, provider: string) => void;
  'orchestrator:dispatched': (orchId: string, workers: WorkerInfo[]) => void;
  'orchestrator:worker-event': (orchId: string, workerId: string, event: ChatStreamEvent) => void;
  'orchestrator:worker-complete': (orchId: string, workerId: string, result: WorkerInfo) => void;
  'orchestrator:all-complete': (orchId: string, results: WorkerInfo[]) => void;
  'orchestrator:status': (orchId: string, status: OrchestratorStatus) => void;
  'orchestrator:error': (orchId: string, message: string) => void;
}

/**
 * Socket.io events to server
 */
export interface ClientToServerEvents {
  'terminal:create': (options?: {
    shell?: string;
    args?: string[];
    cwd?: string;
    cols?: number;
    rows?: number;
  }) => void;
  'terminal:write': (sessionId: string, data: string) => void;
  'terminal:resize': (sessionId: string, cols: number, rows: number) => void;
  'terminal:kill': (sessionId: string) => void;
  'terminal:list': () => void;
  'chat:create': (options: { provider: ChatProvider; cwd?: string }) => void;
  'chat:send': (sessionId: string, message: string) => void;
  'chat:allow-tool': (sessionId: string, toolName: string) => void;
  'chat:abort': (sessionId: string) => void;
  'chat:kill': (sessionId: string) => void;
  'orchestrator:create': (options: { provider: ChatProvider }) => void;
  'orchestrator:dispatch': (orchId: string, tasks: SubTask[]) => void;
  'orchestrator:synthesize': (orchId: string) => void;
  'orchestrator:abort': (orchId: string) => void;
  'orchestrator:kill': (orchId: string) => void;
}
