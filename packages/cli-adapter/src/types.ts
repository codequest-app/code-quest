/**
 * CLI adapter types — framework-free, pure logic interfaces.
 */

import type { ChildProcess, SpawnOptions } from 'node:child_process';

import type { ChatProvider, ChatStats, ChatStreamEvent } from '@code-quest/shared';

export interface StreamParser {
  parseLine(line: string): ChatStreamEvent[];
  getCliSessionId(): string | null;
}

export type ProcessFactory = (
  command: string,
  args: string[],
  options: SpawnOptions,
) => ChildProcess;

export type ParserFactory = (provider: ChatProvider) => StreamParser;

export type ChatSessionMode = 'print' | 'interactive';

export interface ChatSessionOptions {
  provider: ChatProvider;
  command: string;
  baseArgs: string[];
  cwd?: string;
  env?: Record<string, string | undefined>;
  mode?: ChatSessionMode;
}

export interface ChatSessionDeps extends ChatSessionOptions {
  processFactory: ProcessFactory;
  parserFactory: ParserFactory;
}

export type ChatSessionState = 'idle' | 'processing';

export interface ControlResponse {
  requestId: string;
  success: boolean;
  response?: {
    models?: Array<{
      value: string;
      displayName: string;
      description: string;
      supportsEffort?: boolean;
    }>;
    account?: { email: string; subscriptionType: string };
    commands?: Array<{ name: string; description: string }>;
    outputStyle?: string;
    availableOutputStyles?: string[];
    pid?: number;
  };
  error?: string;
}

export interface ChatSession {
  readonly id: string;
  readonly provider: ChatProvider;
  readonly state: ChatSessionState;
  readonly cliSessionId: string | null;
  readonly mode: ChatSessionMode;
  sendMessage(message: string): void;
  addAllowedTool(tool: string): void;
  abort(): void;
  kill(): void;
  onEvent(handler: (event: ChatStreamEvent) => void): void;
  onComplete(handler: (stats: ChatStats) => void): void;
  onError(handler: (error: string) => void): void;
  onExit(handler: () => void): void;

  // Control protocol methods (interactive mode only)
  initialize(): void;
  setModel(model: string): void;
  onControlResponse(handler: (response: ControlResponse) => void): void;
}
