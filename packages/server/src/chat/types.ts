/**
 * Chat stream event types
 */

import type { ChildProcess, SpawnOptions } from 'child_process';

export type ChatStreamEvent =
  | { type: 'init'; data: { sessionId: string } }
  | { type: 'text'; data: { content: string } }
  | { type: 'thinking'; data: { content: string } }
  | { type: 'tool_use'; data: { name: string; input: unknown } }
  | { type: 'tool_result'; data: { name: string; output: string } }
  | { type: 'result'; data: { stats: ChatStats } }
  | { type: 'error'; data: { message: string } }
  | { type: 'permission_request'; data: { toolName: string; description: string } };

export interface ChatStats {
  costUsd?: number;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface StreamParser {
  feed(chunk: string): ChatStreamEvent[];
  getCliSessionId(): string | null;
}

export type ChatProvider = 'claude' | 'gemini';

export type ProcessFactory = (
  command: string,
  args: string[],
  options: SpawnOptions,
) => ChildProcess;

export interface ChatSessionOptions {
  provider: ChatProvider;
  command: string;
  baseArgs: string[];
  cwd?: string;
  processFactory?: ProcessFactory;
}

export interface ChatSession {
  readonly id: string;
  readonly provider: ChatProvider;
  sendMessage(message: string): void;
  respond(data: string): void;
  abort(): void;
  kill(): void;
  onEvent(handler: (event: ChatStreamEvent) => void): void;
  onComplete(handler: (stats: ChatStats) => void): void;
  onError(handler: (error: string) => void): void;
  onExit(handler: () => void): void;
}

export interface ChatManager {
  createSession(options: { provider: ChatProvider; cwd?: string }): ChatSession;
  getSession(id: string): ChatSession | undefined;
  removeSession(id: string): void;
  listSessions(): string[];
  cleanup(): void;
}
