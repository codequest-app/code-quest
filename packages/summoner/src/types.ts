import type { ChildProcess, SpawnOptions } from 'node:child_process';
import type { ChatStats, ChatStreamEvent } from '@code-quest/shared';

export type { ChatStats, ChatStreamEvent };

// --- Raw entry for recording ---

export interface RawEntry {
  timestamp: number;
  sessionId: string;
  promptId: string;
  direction: 'in' | 'out' | 'err';
  raw: string;
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
