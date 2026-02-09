/**
 * Client-side types
 */

/**
 * Terminal session state
 */
export interface TerminalSession {
  id: string;
  pid: number;
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

  // Actions
  addSession: (id: string, pid: number) => void;
  removeSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  setSocketConnected: (connected: boolean) => void;
  setSocketError: (error: string | null) => void;
  getSession: (id: string) => TerminalSession | undefined;
  getActiveSession: () => TerminalSession | undefined;
  getSessions: () => TerminalSession[];
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
}

/**
 * Socket.io events to server
 */
export interface ClientToServerEvents {
  'terminal:create': (options?: {
    shell?: string;
    cwd?: string;
    cols?: number;
    rows?: number;
  }) => void;
  'terminal:write': (sessionId: string, data: string) => void;
  'terminal:resize': (sessionId: string, cols: number, rows: number) => void;
  'terminal:kill': (sessionId: string) => void;
  'terminal:list': () => void;
}
