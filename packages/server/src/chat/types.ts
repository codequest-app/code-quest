/**
 * Chat stream event types
 */

import type { ChildProcess, SpawnOptions } from 'node:child_process';

import type { ChatProvider, ChatStats, ChatStreamEvent } from '@code-quest/shared';

export interface StreamParser {
  feed(chunk: string): ChatStreamEvent[];
  getCliSessionId(): string | null;
}

export type ProcessFactory = (
  command: string,
  args: string[],
  options: SpawnOptions,
) => ChildProcess;

export type ParserFactory = (provider: ChatProvider) => StreamParser;

export interface ChatSessionOptions {
  provider: ChatProvider;
  command: string;
  baseArgs: string[];
  cwd?: string;
  env?: Record<string, string | undefined>;
}

export interface ChatSessionDeps extends ChatSessionOptions {
  processFactory: ProcessFactory;
  parserFactory: ParserFactory;
}

export type ChatSessionState = 'idle' | 'processing';

export interface ChatSession {
  readonly id: string;
  readonly provider: ChatProvider;
  readonly state: ChatSessionState;
  readonly cliSessionId: string | null;
  sendMessage(message: string): void;
  addAllowedTool(tool: string): void;
  abort(): void;
  kill(): void;
  onEvent(handler: (event: ChatStreamEvent) => void): void;
  onComplete(handler: (stats: ChatStats) => void): void;
  onError(handler: (error: string) => void): void;
  onExit(handler: () => void): void;
}

export type ChatSessionFactory = (options: ChatSessionOptions) => ChatSession;

export type ChatCommandsConfig = Record<ChatProvider, { command: string; baseArgs: string[] }>;

export interface ChatManager {
  createSession(options: { provider: ChatProvider; cwd?: string }): ChatSession;
  getSession(id: string): ChatSession | undefined;
  removeSession(id: string): void;
  listSessions(): string[];
  cleanup(): void;
}
