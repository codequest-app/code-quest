import type { ChildProcess, SpawnOptions } from 'node:child_process';

// --- Chat stream events (normalized from any AI provider) ---

export type ChatStreamEvent =
  | { type: 'init'; sessionId: string; model?: string; tools?: string[] }
  | { type: 'text'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; id: string; name: string; output: string }
  | { type: 'result'; stats: ChatStats }
  | { type: 'error'; message: string }
  | {
      type: 'control_response';
      requestId: string;
      success: boolean;
      response?: Record<string, unknown>;
      error?: string;
    }
  | {
      type: 'control_request';
      requestId: string;
      subtype: string;
      toolName?: string;
      input?: unknown;
      callbackId?: string;
      toolUseId?: string;
    };

export interface ChatStats {
  costUsd?: number;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}

// --- Raw entry for recording ---

export interface RawEntry {
  timestamp: number;
  sessionId: string;
  turnId: number;
  direction: 'in' | 'out' | 'err';
  raw: string;
  parsed?: ChatStreamEvent[];
}

// --- Session interfaces ---

export interface SessionEvents {
  event: (event: ChatStreamEvent) => void;
  raw: (entry: RawEntry) => void;
  error: (message: string) => void;
  exit: () => void;
}

export interface ChatSession {
  readonly id: string;
  readonly state: 'idle' | 'processing';
  sendMessage(message: string): void;
  abort(): void;
  kill(): void;
  on<K extends keyof SessionEvents>(event: K, listener: SessionEvents[K]): this;
  off<K extends keyof SessionEvents>(event: K, listener: SessionEvents[K]): this;
  once<K extends keyof SessionEvents>(event: K, listener: SessionEvents[K]): this;
}

export interface ControlResponse {
  success: boolean;
  response?: Record<string, unknown>;
  error?: string;
}

export interface ControllableSession extends ChatSession {
  readonly cliSessionId: string | null;
  initialize(options?: Record<string, unknown>): Promise<ControlResponse>;
  setModel(model: string): Promise<ControlResponse>;
  setPermissionMode(mode: string): Promise<ControlResponse>;
  interrupt(): Promise<ControlResponse>;
  respondToControlRequest(requestId: string, response: Record<string, unknown>): void;
}

// --- Process abstraction ---

export type ProcessFactory = (
  command: string,
  args: string[],
  options: SpawnOptions,
) => ChildProcess;
